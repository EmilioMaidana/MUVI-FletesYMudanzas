package com.vaflete.controller;

import com.vaflete.dto.CotizacionRequest;
import com.vaflete.dto.CotizacionResponse;
import com.vaflete.service.CotizadorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cotizacion")
public class CotizacionController {

    private final CotizadorService cotizadorService;

    public CotizacionController(CotizadorService cotizadorService) {
        this.cotizadorService = cotizadorService;
    }

    @PostMapping
    public ResponseEntity<CotizacionResponse> cotizar(@Valid @RequestBody CotizacionRequest request) {
        CotizacionResponse response = cotizadorService.cotizar(request.getOrigen(), request.getDestino());
        return ResponseEntity.ok(response);
    }
}
