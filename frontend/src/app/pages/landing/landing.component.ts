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
const LERP_FACTOR = 0.08;

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
    this.startRenderLoop();
    this.initAutocomplete();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('scroll', this.scrollHandler);
    this.resizeObserver?.disconnect();
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

  private setupCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  private setupResizeObserver() {
    this.resizeObserver = new ResizeObserver(() => {
      this.setupCanvas();
      this.drawFrame(this.currentFrame);
    });
    this.resizeObserver.observe(this.canvasRef.nativeElement);
  }

  private bindScrollListener() {
    this.scrollHandler = () => {
      const container = this.scrollContainerRef.nativeElement;
      const rect = container.getBoundingClientRect();
      const scrollableHeight = container.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollableHeight));

      this.targetFrame = Math.round(progress * (TOTAL_FRAMES - 1));

      const shouldShow = progress >= 0.92;
      if (shouldShow !== this.showForm) {
        this.ngZone.run(() => { this.showForm = shouldShow; });
      }
    };

    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.scrollHandler, { passive: true });
    });
  }

  private startRenderLoop() {
    this.ngZone.runOutsideAngular(() => {
      const loop = () => {
        const diff = this.targetFrame - this.currentFrame;
        if (Math.abs(diff) > 0.5) {
          this.currentFrame += diff * LERP_FACTOR;
          this.drawFrame(Math.round(this.currentFrame));
        }
        this.animationId = requestAnimationFrame(loop);
      };
      loop();
    });
  }

  private drawFrame(index: number) {
    const frameIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, index));
    const img = this.frames[frameIndex];
    if (!img) return;

    const canvas = this.canvasRef.nativeElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;

    // Fill with background matching the truck's dark anthracite
    this.ctx.fillStyle = '#0a0a0f';
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
