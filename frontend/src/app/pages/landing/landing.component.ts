import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, CotizacionResponse, ReservaRequest } from '../../services/api.service';

declare const google: any;

const TOTAL_FRAMES = 160;
const LERP_FACTOR = 0.12;

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

  showForm = false;
  loadingProgress = 0;
  imagesLoaded = false;
  cotizacion: CotizacionResponse | null = null;
  cargandoCotizacion = false;
  cargandoReserva = false;
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

  private ctx!: CanvasRenderingContext2D;
  private frames: HTMLImageElement[] = [];
  private currentFrame = 0;
  private targetFrame = 0;
  private animationId = 0;
  private resizeObserver!: ResizeObserver;
  private scrollHandler!: () => void;
  private orientationHandler!: () => void;
  private scrollProgress = 0;
  private canvasDpr = 1;
  private resizeTimeout: any = 0;

  constructor(
    private apiService: ApiService,
    private ngZone: NgZone
  ) {}

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.setupCanvas();
    this.preloadImages();
    this.bindScrollListener();
    this.setupResizeObserver();
    this.bindOrientationHandler();
    this.startRenderLoop();
    this.initAutocomplete();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('scroll', this.scrollHandler);
    window.removeEventListener('resize', this.orientationHandler);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.orientationHandler);
    }
    this.resizeObserver?.disconnect();
    clearTimeout(this.resizeTimeout);
  }

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
          img.onload = () => {
            this.frames[i] = img;
            loaded++;
            this.ngZone.run(() => {
              this.loadingProgress = Math.round((loaded / TOTAL_FRAMES) * 100);
            });
            resolve();
          };
          img.onerror = () => {
            loaded++;
            this.ngZone.run(() => {
              this.loadingProgress = Math.round((loaded / TOTAL_FRAMES) * 100);
            });
            resolve();
          };
        }));
      }

      Promise.all(promises).then(() => {
        if (end < TOTAL_FRAMES) {
          loadBatch(end);
        } else {
          this.ngZone.run(() => { this.imagesLoaded = true; });
          this.drawFrame(0);
        }
      });
    };

    loadBatch(0);
  }

  /**
   * Set up the canvas dimensions accounting for DPR.
   * Canvas internal resolution = CSS size * DPR for crisp rendering.
   * ctx.scale(dpr) lets us draw in CSS-pixel coordinates.
   */
  private setupCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvasDpr = dpr;

    // Use clientWidth/clientHeight for stable dimensions on all browsers
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    // Scale context so we draw in CSS-pixel space
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private setupResizeObserver() {
    this.resizeObserver = new ResizeObserver(() => {
      // Debounce resize to avoid layout thrashing during orientation change
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.setupCanvas();
        this.drawFrame(Math.round(this.currentFrame));
      }, 50);
    });
    this.resizeObserver.observe(this.canvasRef.nativeElement);
  }

  /**
   * Handle device orientation changes and mobile browser chrome
   * resize (iOS Safari address bar show/hide).
   */
  private bindOrientationHandler() {
    this.orientationHandler = () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.setupCanvas();
        this.drawFrame(Math.round(this.currentFrame));
      }, 100);
    };

    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('resize', this.orientationHandler, { passive: true });

      // iOS Safari: visualViewport fires when address bar collapses/expands
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', this.orientationHandler, { passive: true });
      }
    });
  }

  private bindScrollListener() {
    this.scrollHandler = () => {
      const container = this.scrollContainerRef.nativeElement;
      const rect = container.getBoundingClientRect();
      const scrollableHeight = container.offsetHeight - window.innerHeight;

      if (scrollableHeight <= 0) return;

      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollableHeight));

      this.scrollProgress = progress;
      this.targetFrame = Math.round(progress * (TOTAL_FRAMES - 1));

      const shouldShow = progress >= 0.92;
      if (shouldShow !== this.showForm) {
        this.ngZone.run(() => {
          this.showForm = shouldShow;
        });
      }
    };

    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.scrollHandler, { passive: true });
    });
  }

  private startRenderLoop() {
    this.ngZone.runOutsideAngular(() => {
      let lastDisplay = '00';

      const loop = () => {
        const diff = this.targetFrame - this.currentFrame;
        if (Math.abs(diff) > 0.5) {
          this.currentFrame += diff * LERP_FACTOR;
          this.drawFrame(Math.round(this.currentFrame));
        }

        // Update progress display — only trigger zone when string changes
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
    const frameIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, index));
    const img = this.frames[frameIndex];
    if (!img || !img.complete || !img.naturalWidth) return;

    const canvas = this.canvasRef.nativeElement;
    const dpr = this.canvasDpr;

    // CSS-pixel dimensions (ctx is already scaled by dpr)
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;

    if (cw <= 0 || ch <= 0) return;

    // Fill with background matching the stage color
    const stageColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--t-stage').trim() || '#0a0a0f';
    this.ctx.fillStyle = stageColor;
    this.ctx.fillRect(0, 0, cw, ch);

    // object-fit: cover + scale 1.08 to crop watermark at bottom-right
    const SCALE = 1.08;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = cw / ch;

    let drawW: number, drawH: number, offsetX: number, offsetY: number;

    if (imgRatio > canvasRatio) {
      // Image is wider than canvas — fit height, overflow width
      drawH = ch * SCALE;
      drawW = drawH * imgRatio;
    } else {
      // Image is taller than canvas — fit width, overflow height
      drawW = cw * SCALE;
      drawH = drawW / imgRatio;
    }

    // Center horizontally, shift up slightly to push watermark below viewport
    offsetX = (cw - drawW) / 2;
    offsetY = (ch - drawH) / 2 - (drawH * 0.02);

    this.ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  }

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
      const origenAc = new google.maps.places.Autocomplete(
        this.origenInput.nativeElement, options
      );
      origenAc.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const place = origenAc.getPlace();
          this.formData.origen = place.formatted_address || place.name || '';
        });
      });
    }

    if (this.destinoInput) {
      const destinoAc = new google.maps.places.Autocomplete(
        this.destinoInput.nativeElement, options
      );
      destinoAc.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const place = destinoAc.getPlace();
          this.formData.destino = place.formatted_address || place.name || '';
        });
      });
    }
  }

  errorMsg = '';

  cotizar() {
    this.errorMsg = '';

    // Use input value directly if autocomplete didn't fire
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
        this.cotizacion = res;
        this.cargandoCotizacion = false;
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
