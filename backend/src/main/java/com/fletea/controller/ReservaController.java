package com.fletea.controller;

import com.fletea.dto.ReservaRequest;
import com.fletea.dto.ReservaResponse;
import com.fletea.model.Reserva;
import com.fletea.service.ReservaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    private final ReservaService reservaService;

    public ReservaController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    @PostMapping
    public ResponseEntity<ReservaResponse> crearReserva(@Valid @RequestBody ReservaRequest request) {
        ReservaResponse response = reservaService.crearReserva(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<Reserva>> listarReservas() {
        return ResponseEntity.ok(reservaService.listarTodas());
    }
}
