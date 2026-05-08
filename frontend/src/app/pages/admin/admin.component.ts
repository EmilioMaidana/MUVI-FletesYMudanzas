import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Reserva } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  // Auth
  isAuthenticated = false;
  loginUser = '';
  loginPass = '';
  loginError = '';
  loginLoading = false;

  // Admin
  reservas: Reserva[] = [];
  cargando = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.isAuthenticated = true;
      this.cargarReservas();
    }
  }

  login() {
    if (!this.loginUser || !this.loginPass) return;

    this.loginLoading = true;
    this.loginError = '';

    this.authService.login(this.loginUser, this.loginPass).subscribe({
      next: () => {
        this.loginLoading = false;
        this.isAuthenticated = true;
        this.cargarReservas();
      },
      error: () => {
        this.loginLoading = false;
        this.loginError = 'Usuario o contraseña incorrectos';
      }
    });
  }

  logout() {
    this.authService.logout();
    this.isAuthenticated = false;
    this.reservas = [];
    this.loginUser = '';
    this.loginPass = '';
    this.loginError = '';
  }

  cargarReservas() {
    this.cargando = true;
    this.apiService.listarReservas().subscribe({
      next: (res) => {
        this.reservas = res;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        if (err.status === 401) {
          this.authService.logout();
          this.isAuthenticated = false;
          this.loginError = 'Sesión expirada. Ingresá nuevamente.';
        } else {
          alert('Error al cargar las reservas.');
        }
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
