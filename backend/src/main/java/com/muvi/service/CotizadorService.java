package com.muvi.service;

import com.muvi.dto.CotizacionResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class CotizadorService {

    @Value("${muvi.deposit-percentage}")
    private double porcentajeSena;

    private final GoogleMapsService googleMapsService;

    public CotizadorService(GoogleMapsService googleMapsService) {
        this.googleMapsService = googleMapsService;
    }

    public CotizacionResponse cotizar(String origen, String destino) {
        BigDecimal distanciaKm = googleMapsService.calcularDistanciaRutaCerrada(origen, destino);

        double costoTotal = PricingEngine.calculateQuote(distanciaKm.doubleValue());

        BigDecimal total = BigDecimal.valueOf(costoTotal).setScale(0, RoundingMode.HALF_UP);
        BigDecimal sena = total.multiply(BigDecimal.valueOf(porcentajeSena))
                .setScale(0, RoundingMode.HALF_UP);

        return new CotizacionResponse(distanciaKm, total, sena);
    }
}
