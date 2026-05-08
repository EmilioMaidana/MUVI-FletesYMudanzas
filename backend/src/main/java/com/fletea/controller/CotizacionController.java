package com.fletea.controller;

import com.fletea.dto.CotizacionRequest;
import com.fletea.dto.CotizacionResponse;
import com.fletea.service.CotizadorService;
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
