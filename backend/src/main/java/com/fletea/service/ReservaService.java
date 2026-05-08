package com.fletea.service;

import com.mercadopago.resources.preference.Preference;
import com.fletea.dto.CotizacionResponse;
import com.fletea.dto.ReservaRequest;
import com.fletea.dto.ReservaResponse;
import com.fletea.model.EstadoReserva;
import com.fletea.model.Reserva;
import com.fletea.repository.ReservaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final CotizadorService cotizadorService;
    private final MercadoPagoService mercadoPagoService;

    public ReservaService(ReservaRepository reservaRepository,
                          CotizadorService cotizadorService,
                          MercadoPagoService mercadoPagoService) {
        this.reservaRepository = reservaRepository;
        this.cotizadorService = cotizadorService;
        this.mercadoPagoService = mercadoPagoService;
    }

    @Transactional
    public ReservaResponse crearReserva(ReservaRequest request) {
        CotizacionResponse cotizacion = cotizadorService.cotizar(request.getOrigen(), request.getDestino());

        Reserva reserva = new Reserva();
        reserva.setNombreCompleto(request.getNombreCompleto());
        reserva.setTelefono(request.getTelefono());
        reserva.setEmail(request.getEmail());
        reserva.setOrigen(request.getOrigen());
        reserva.setDestino(request.getDestino());
        reserva.setFecha(LocalDate.parse(request.getFecha()));
        reserva.setHora(LocalTime.parse(request.getHora()));
        reserva.setDistanciaKm(cotizacion.getDistanciaKm());
        reserva.setCostoTotal(cotizacion.getCostoTotal());
        reserva.setMontoSena(cotizacion.getMontoSena());
        reserva.setEstado(EstadoReserva.PENDIENTE_PAGO);

        reserva = reservaRepository.save(reserva);

        Preference preference = mercadoPagoService.crearPreferencia(reserva.getId(), cotizacion.getMontoSena());
        reserva.setMercadoPagoPreferenceId(preference.getId());
        reserva = reservaRepository.save(reserva);

        return new ReservaResponse(reserva.getId(), preference.getInitPoint(), reserva.getMontoSena());
    }

    @Transactional
    public void confirmarPago(String externalReference, String paymentId) {
        Long reservaId = Long.parseLong(externalReference);
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada: " + reservaId));

        reserva.setEstado(EstadoReserva.RESERVADO);
        reserva.setMercadoPagoPaymentId(paymentId);
        reservaRepository.save(reserva);
    }

    public List<Reserva> listarTodas() {
        return reservaRepository.findAll();
    }
}
