import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Reserva } from '../../services/api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  reservas: Reserva[] = [];
  cargando = true;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.cargarReservas();
  }

  cargarReservas() {
    this.cargando = true;
    this.apiService.listarReservas().subscribe({
      next: (res) => {
        this.reservas = res;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        alert('Error al cargar las reservas.');
      }
    });
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'RESERVADO': return 'badge-success';
      case 'COMPLETADO': return 'badge-info';
      default: return 'badge-warning';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'PENDIENTE_PAGO': return 'Pendiente de pago';
      case 'RESERVADO': return 'Reservado';
      case 'COMPLETADO': return 'Completado';
      default: return estado;
    }
  }
}
