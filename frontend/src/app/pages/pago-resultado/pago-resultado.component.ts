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
    .resultado-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-light);
      padding: 2rem;
    }
    .resultado-card {
      text-align: center;
      padding: 3rem;
      background: var(--white);
      border-radius: 16px;
      box-shadow: var(--shadow);
      max-width: 500px;
    }
    .icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    .exitoso .icon { color: #28a745; }
    .fallido .icon { color: #dc3545; }
    .pendiente .icon { color: #ffc107; }
    h1 { margin-bottom: 1rem; color: var(--text-dark); }
    p { color: var(--text-muted); margin-bottom: 2rem; }
    .btn-volver {
      display: inline-block;
      padding: 0.8rem 2rem;
      background: var(--accent);
      color: var(--white);
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
    }
  `]
})
export class PagoResultadoComponent {
  estado: string;

  constructor(private route: ActivatedRoute) {
    this.estado = this.route.snapshot.data['estado'] || 'pendiente';
  }
}
