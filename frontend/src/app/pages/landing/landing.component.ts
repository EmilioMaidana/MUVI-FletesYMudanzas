import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  HostListener,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, CotizacionResponse, ReservaRequest } from '../../services/api.service';

declare const google: any;

const TOTAL_FRAMES = 160;
const LERP_FACTOR = 0.12;
const FIRST_BATCH = 32;     // frames needed before showing the page
const MOBILE_BP   = 600;    // px — chip/social mobile collapse breakpoint

interface SocialLink {
  name: string;
  href: string;
  img: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scrollCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('scrollContainer') scrollContainerRef!: ElementRef<HTMLElement>;
  @ViewChild('origenInput') origenInput!: ElementRef<HTMLInputElement>;
  @ViewChild('destinoInput') destinoInput!: ElementRef<HTMLInputElement>;

  // --- Loader state ---
  loadingProgress = 0;
  imagesLoaded = false;

  // --- Form state ---
  showForm = false;
  cotizacion: CotizacionResponse | null = null;
  cargandoCotizacion = false;
  cargandoReserva = false;
  errorMsg = '';
  scrollProgressDisplay = '00';

  formData: ReservaRequest = {
    nombreCompleto: '',
    telefono: '',
    email: '',
    origen: '',
    destino: '',
    fecha: '',
    hora: ''
  };

  // --- Mutex panel state for trust chip + social bar (mobile) ---
  openPanel: 'chip' | 'social' | null = null;
  isMobile = false;

  // --- Social links (placeholders — replace with real handles before deploy) ---
  socialLinks: SocialLink[] = [
    { name: 'WhatsApp',  href: 'https://wa.me/541100000000',   img: 'assets/social-whatsapp.jpeg' },
    { name: 'Instagram', href: 'https://instagram.com/fletea', img: 'assets/social-instagram.jpeg' },
    { name: 'Facebook',  href: 'https://facebook.com/fletea',  img: 'assets/social-facebook.jpeg' },
    { name: 'TikTok',    href: 'https://tiktok.com/@fletea',   img: 'assets/social-tiktok.jpeg' },
  ];

  // --- Internal canvas state ---
  private ctx!: CanvasRenderingContext2D;
  private frames: HTMLImageElement[] = [];
  private currentFrame = 0;
  private targetFrame = 0;
  private animationId = 0;
  private resizeObserver!: ResizeObserver;
  private scrollHandler!: () => void;
  private orientationHandler!: () => void;
  private mediaQueryList?: MediaQueryList;
  private mqlListener?: (e: MediaQueryListEvent) => void;
  private scrollProgress = 0;
  private canvasDpr = 1;
  private resizeTimeout: any = 0;
  private cachedStageColor = '#0a0a0f';
  private bodyOverflowBackup = '';

  // ====== Computed getters used by template ======
  get trustExpanded(): boolean {
    return !this.isMobile || this.openPanel === 'chip';
  }
  get socialExpanded(): boolean {
    return this.openPanel === 'social';
  }
  get socialBubblesVisible(): boolean {
    return !this.isMobile || this.openPanel === 'social';
  }

  constructor(
    private apiService: ApiService,
    private ngZone: NgZone
  ) {}

  // ====== Lifecycle ======
  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.cacheStageColor();
    this.setupCanvas();
    this.preloadImages();
    this.bindScrollListener();
    this.setupResizeObserver();
    this.bindOrientationHandler();
    this.bindMediaQuery();
    this.startRenderLoop();
    this.initAutocomplete();

    // Initial CSS var values so cover overlay is visible at p=0
    this.updateScrollVars(0);
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('scroll', this.scrollHandler);
    window.removeEventListener('resize', this.orientationHandler);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.orientationHandler);
    }
    this.resizeObserver?.disconnect();
    if (this.mediaQueryList && this.mqlListener) {
      this.mediaQueryList.removeEventListener('change', this.mqlListener);
    }
    clearTimeout(this.resizeTimeout);
    this.unlockBodyScroll();
  }

  // ====== Modal: keyboard escape ======
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.cotizacion) this.closeQuoteModal();
  }

  // ====== PageLogo: smooth scroll to top → resets truck animation ======
  onPageLogoClick(e: Event) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ====== TrustChip handlers ======
  onTrustChipClick(e: Event) {
    if (this.isMobile && this.openPanel !== 'chip') {
      e.preventDefault();
      this.openPanel = 'chip';
    }
    // On desktop: anchor click (href="#") — let it pass; we prevent it via no-op handler if expanded
    else {
      e.preventDefault();
    }
  }

  onTrustChipClose(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.openPanel = null;
  }

  // ====== SocialBar handler ======
  onSocialToggle() {
    this.openPanel = this.openPanel === 'social' ? null : 'social';
  }

  // ====== QuoteModal close ======
  closeQuoteModal() {
    this.cotizacion = null;
    this.unlockBodyScroll();
  }

  private lockBodyScroll() {
    this.bodyOverflowBackup = document.body.style.overflow || '';
    document.body.style.overflow = 'hidden';
  }

  private unlockBodyScroll() {
    document.body.style.overflow = this.bodyOverflowBackup;
  }

  // ====== Canvas: preload, setup, draw ======
  private preloadImages() {
    const batchSize = 20;
    let loaded = 0;

    const loadBatch = (startIndex: number) => {
      const end = Math.min(startIndex + batchSize, TOTAL_FRAMES);
      const promises: Promise<void>[] = [];

      for (let i = startIndex; i < end; i++) {
        promises.push(new Promise<void>((resolve) => {
          const img = new Image();
          const frameNum = String(i + 1).padStart(3, '0');
          img.src = `assets/webp/camion_${frameNum}.webp`;
          img.onload = img.onerror = () => {
            this.frames[i] = img;
            loaded++;
            const pct = Math.min(100, Math.round((loaded / FIRST_BATCH) * 100));
            // Loader percent shows progress to FIRST_BATCH (when overlay hides)
            this.ngZone.run(() => {
              this.loadingProgress = pct;
              if (loaded >= FIRST_BATCH && !this.imagesLoaded) {
                this.imagesLoaded = true;
              }
            });
            resolve();
          };
        }));
      }

      Promise.all(promises).then(() => {
        if (end < TOTAL_FRAMES) loadBatch(end);
        else this.drawFrame(0);
      });
    };

    loadBatch(0);
  }

  private cacheStageColor() {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue('--t-stage').trim();
    this.cachedStageColor = v || '#0a0a0f';
  }

  private setupCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvasDpr = dpr;

    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private setupResizeObserver() {
    this.resizeObserver = new ResizeObserver(() => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.setupCanvas();
        this.cacheStageColor();
        this.drawFrame(Math.round(this.currentFrame));
      }, 50);
    });
    this.resizeObserver.observe(this.canvasRef.nativeElement);
  }

  private bindOrientationHandler() {
    this.orientationHandler = () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.setupCanvas();
        this.cacheStageColor();
        this.drawFrame(Math.round(this.currentFrame));
      }, 100);
    };
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('resize', this.orientationHandler, { passive: true });
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', this.orientationHandler, { passive: true });
      }
    });
  }

  private bindMediaQuery() {
    this.mediaQueryList = window.matchMedia(`(max-width:${MOBILE_BP}px)`);
    this.isMobile = this.mediaQueryList.matches;

    this.mqlListener = (e: MediaQueryListEvent) => {
      this.ngZone.run(() => {
        this.isMobile = e.matches;
        // Auto-collapse panels when leaving mobile
        if (!e.matches) this.openPanel = null;
      });
    };
    this.mediaQueryList.addEventListener('change', this.mqlListener);
  }

  // ====== Scroll → progress + per-element fade math ======
  private bindScrollListener() {
    this.scrollHandler = () => {
      const container = this.scrollContainerRef.nativeElement;
      const rect = container.getBoundingClientRect();
      const scrollableHeight = container.offsetHeight - window.innerHeight;
      if (scrollableHeight <= 0) return;

      const scrolled = -rect.top;
      const p = Math.max(0, Math.min(1, scrolled / scrollableHeight));

      this.scrollProgress = p;
      this.targetFrame = Math.round(p * (TOTAL_FRAMES - 1));

      this.updateScrollVars(p);

      // Form visibility — only flip when changes
      const shouldShow = p >= 0.92;
      if (shouldShow !== this.showForm) {
        this.ngZone.run(() => { this.showForm = shouldShow; });
      }
    };

    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.scrollHandler, { passive: true });
    });
  }

  /**
   * Per-element fade math from design spec:
   *   cueOpacity   = clamp(1 - p / 0.12, 0, 1)
   *   brandOpacity = clamp(1 - p / 0.35, 0, 1)
   *   titleOpacity = clamp(1 - p / 0.45, 0, 1)
   *   titleBlur    = p * 12px
   *   titleScale   = 1 - p * 0.04
   *   titleY       = -p * 60px
   *   counterOpacity = clamp(p * 4, 0, 1)
   *   vignetteOpacity = max(0.25, 1 - p * 0.6)
   *
   * Set as CSS vars on :root so component CSS reads them without
   * triggering Angular change detection per-frame.
   */
  private updateScrollVars(p: number) {
    const cueOp     = Math.max(0, Math.min(1, 1 - p / 0.12));
    const brandOp   = Math.max(0, Math.min(1, 1 - p / 0.35));
    const titleOp   = Math.max(0, Math.min(1, 1 - p / 0.45));
    const titleBlur = p * 12;
    const titleScale = 1 - p * 0.04;
    const titleY     = -p * 60;
    const counterOp  = Math.max(0, Math.min(1, p * 4));
    const vignetteOp = Math.max(0.25, 1 - p * 0.6);

    const root = document.documentElement.style;
    root.setProperty('--cue-opacity', cueOp.toFixed(3));
    root.setProperty('--brand-opacity', (brandOp * 0.9).toFixed(3));
    root.setProperty('--brand-ty', `${(1 - brandOp) * -16}px`);
    root.setProperty('--brand-blur', `${(1 - brandOp) * 5}px`);
    root.setProperty('--title-opacity', titleOp.toFixed(3));
    root.setProperty('--title-blur', `${titleBlur.toFixed(2)}px`);
    root.setProperty('--title-scale', titleScale.toFixed(3));
    root.setProperty('--title-y', `${titleY.toFixed(1)}px`);
    root.setProperty('--counter-opacity', counterOp.toFixed(3));
    root.setProperty('--vignette-opacity', vignetteOp.toFixed(3));
  }

  // ====== Render loop (RAF, runs outside zone) ======
  private startRenderLoop() {
    this.ngZone.runOutsideAngular(() => {
      let lastDisplay = '00';

      const loop = () => {
        const diff = this.targetFrame - this.currentFrame;
        if (Math.abs(diff) > 0.5) {
          this.currentFrame += diff * LERP_FACTOR;
          this.drawFrame(Math.round(this.currentFrame));
        }

        // Throttle counter update — only enter zone when string changes
        const pct = Math.round(this.scrollProgress * 100);
        const display = String(pct).padStart(2, '0');
        if (display !== lastDisplay) {
          lastDisplay = display;
          this.ngZone.run(() => {
            this.scrollProgressDisplay = display;
          });
        }

        this.animationId = requestAnimationFrame(loop);
      };
      loop();
    });
  }

  private drawFrame(index: number) {
    const idx = Math.max(0, Math.min(TOTAL_FRAMES - 1, index));
    let img = this.frames[idx];

    // Fallback: search outward for nearest loaded frame to avoid jump-to-frame-0 flash
    if (!img || !img.complete || !img.naturalWidth) {
      for (let d = 1; d < TOTAL_FRAMES; d++) {
        const a = this.frames[idx - d];
        const b = this.frames[idx + d];
        if (a && a.complete && a.naturalWidth) { img = a; break; }
        if (b && b.complete && b.naturalWidth) { img = b; break; }
      }
    }
    if (!img || !img.complete || !img.naturalWidth) return;

    const canvas = this.canvasRef.nativeElement;
    const dpr = this.canvasDpr;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;
    if (cw <= 0 || ch <= 0) return;

    // Fill background, then draw cover-style with slight upscale to crop watermark
    this.ctx.fillStyle = this.cachedStageColor;
    this.ctx.fillRect(0, 0, cw, ch);

    const SCALE = 1.06;
    const ir = img.naturalWidth / img.naturalHeight;
    const cr = cw / ch;
    let dw: number, dh: number;
    if (ir > cr) { dh = ch * SCALE; dw = dh * ir; }
    else         { dw = cw * SCALE; dh = dw / ir; }
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2 - dh * 0.02;
    this.ctx.drawImage(img, dx, dy, dw, dh);
  }

  // ====== Google Places Autocomplete ======
  private initAutocomplete() {
    const waitForGoogle = () => {
      if (typeof google !== 'undefined' && google.maps && google.maps.places) {
        this.setupAutocompleteFields();
      } else {
        setTimeout(waitForGoogle, 500);
      }
    };
    waitForGoogle();
  }

  private setupAutocompleteFields() {
    const options = {
      componentRestrictions: { country: 'ar' },
      fields: ['formatted_address', 'name', 'geometry']
    };

    if (this.origenInput) {
      const ac = new google.maps.places.Autocomplete(this.origenInput.nativeElement, options);
      ac.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const place = ac.getPlace();
          this.formData.origen = place.formatted_address || place.name || '';
        });
      });
    }
    if (this.destinoInput) {
      const ac = new google.maps.places.Autocomplete(this.destinoInput.nativeElement, options);
      ac.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const place = ac.getPlace();
          this.formData.destino = place.formatted_address || place.name || '';
        });
      });
    }
  }

  // ====== Form handlers ======
  cotizar() {
    this.errorMsg = '';

    // Use raw input value if autocomplete didn't fire
    if (!this.formData.origen && this.origenInput) {
      this.formData.origen = this.origenInput.nativeElement.value;
    }
    if (!this.formData.destino && this.destinoInput) {
      this.formData.destino = this.destinoInput.nativeElement.value;
    }

    if (!this.formData.origen || !this.formData.destino) {
      this.errorMsg = 'Completá origen y destino para cotizar.';
      return;
    }

    this.cargandoCotizacion = true;
    this.cotizacion = null;
    this.apiService.cotizar({
      origen: this.formData.origen,
      destino: this.formData.destino
    }).subscribe({
      next: (res) => {
        this.cargandoCotizacion = false;
        this.cotizacion = res;
        this.lockBodyScroll();
      },
      error: (err) => {
        this.cargandoCotizacion = false;
        const serverMsg = err.error?.message || err.message || '';
        this.errorMsg = serverMsg
          ? 'Error: ' + serverMsg
          : 'No se pudo calcular la cotización. Verificá las direcciones.';
      }
    });
  }

  reservar() {
    if (!this.cotizacion) return;

    this.cargandoReserva = true;
    this.errorMsg = '';
    this.apiService.crearReserva(this.formData).subscribe({
      next: (res) => {
        this.cargandoReserva = false;
        this.unlockBodyScroll();
        window.location.href = res.initPoint;
      },
      error: (err) => {
        this.cargandoReserva = false;
        const serverMsg = err.error?.message || '';
        this.errorMsg = serverMsg
          ? 'Error: ' + serverMsg
          : 'Error al crear la reserva.';
      }
    });
  }
}
