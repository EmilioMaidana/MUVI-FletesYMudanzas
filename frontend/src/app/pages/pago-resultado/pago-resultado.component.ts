import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-pago-resultado',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="resultado-container">
      <div class="resultado-card" [ngClass]="estado">
        <div class="icon" *ngIf="estado === 'exitoso'">&#10003;</div>
        <div class="icon" *ngIf="estado === 'fallido'">&#10007;</div>
        <div class="icon" *ngIf="estado === 'pendiente'">&#8987;</div>

        <h1 *ngIf="estado === 'exitoso'">¡Pago exitoso!</h1>
        <h1 *ngIf="estado === 'fallido'">Pago fallido</h1>
        <h1 *ngIf="estado === 'pendiente'">Pago pendiente</h1>

        <p *ngIf="estado === 'exitoso'">Tu reserva fue confirmada. Nos pondremos en contacto contigo.</p>
        <p *ngIf="estado === 'fallido'">Hubo un problema con tu pago. Intentá nuevamente.</p>
        <p *ngIf="estado === 'pendiente'">Tu pago está siendo procesado. Te notificaremos cuando se confirme.</p>

        <a routerLink="/" class="btn-volver">Volver al inicio</a>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .resultado-container {
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-light);
      padding: 2rem;
      padding-top: calc(2rem + env(safe-area-inset-top, 0px));
      padding-bottom: calc(2rem + env(safe-area-inset-bottom, 0px));
    }

    .resultado-card {
      text-align: center;
      padding: 3rem;
      background: var(--white);
      border-radius: 16px;
      box-shadow: var(--shadow);
      max-width: 500px;
      width: 100%;
    }

    .icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      line-height: 1;
    }

    .exitoso .icon { color: #28a745; }
    .fallido .icon { color: #dc3545; }
    .pendiente .icon { color: #ffc107; }

    h1 {
      margin: 0 0 1rem;
      color: var(--text-dark);
      font-weight: 700;
      letter-spacing: -0.01em;
      font-size: clamp(1.4rem, 4vw, 2rem);
    }

    p {
      color: var(--text-muted);
      margin: 0 0 2rem;
      font-size: 1rem;
      line-height: 1.5;
    }

    .btn-volver {
      display: inline-block;
      padding: 0.8rem 2rem;
      background: var(--accent);
      color: var(--white);
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;
      transition: background 0.25s, transform 0.2s;
      min-height: 44px;
      line-height: 1.5;
    }

    .btn-volver:hover {
      background: var(--accent-hover);
    }

    .btn-volver:active {
      transform: scale(0.97);
    }

    /* Mobile */
    @media (max-width: 768px) {
      .resultado-container {
        padding: 1.5rem;
        padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
      }

      .resultado-card {
        padding: 2rem 1.5rem;
        border-radius: 20px;
      }

      .icon {
        font-size: 3rem;
      }

      p {
        font-size: 0.95rem;
        margin-bottom: 1.5rem;
      }

      .btn-volver {
        width: 100%;
        text-align: center;
        padding: 0.9rem 1.5rem;
      }
    }

    /* Small phones */
    @media (max-width: 380px) {
      .resultado-card {
        padding: 1.5rem 1rem;
      }

      .icon {
        font-size: 2.5rem;
      }

      p {
        font-size: 0.9rem;
      }
    }

    /* Landscape mobile */
    @media (max-height: 500px) and (orientation: landscape) {
      .resultado-container {
        padding: 1rem 2rem;
      }

      .resultado-card {
        padding: 1.5rem 2rem;
      }

      .icon {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
      }

      h1 {
        margin-bottom: 0.5rem;
      }

      p {
        margin-bottom: 1rem;
      }
    }
  `]
})
export class PagoResultadoComponent {
  estado: string;

  constructor(private route: ActivatedRoute) {
    this.estado = this.route.snapshot.data['estado'] || 'pendiente';
  }
}
