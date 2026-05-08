import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CotizacionRequest {
  origen: string;
  destino: string;
}

export interface CotizacionResponse {
  distanciaKm: number;
  costoTotal: number;
  montoSena: number;
}

export interface ReservaRequest {
  nombreCompleto: string;
  telefono: string;
  email: string;
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
}

export interface ReservaResponse {
  id: number;
  initPoint: string;
  montoSena: number;
}

export interface Reserva {
  id: number;
  nombreCompleto: string;
  telefono: string;
  email: string;
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  distanciaKm: number;
  costoTotal: number;
  montoSena: number;
  estado: string;
  creadoEn: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = '/api';

  constructor(private http: HttpClient) {}

  cotizar(request: CotizacionRequest): Observable<CotizacionResponse> {
    return this.http.post<CotizacionResponse>(`${this.baseUrl}/cotizacion`, request);
  }

  crearReserva(request: ReservaRequest): Observable<ReservaResponse> {
    return this.http.post<ReservaResponse>(`${this.baseUrl}/reservas`, request);
  }

  listarReservas(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.baseUrl}/reservas`);
  }
}
