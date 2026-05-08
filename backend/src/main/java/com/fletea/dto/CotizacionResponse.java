package com.fletea.dto;

import java.math.BigDecimal;

public class CotizacionResponse {

    private BigDecimal distanciaKm;
    private BigDecimal costoTotal;
    private BigDecimal montoSena;

    public CotizacionResponse() {}

    public CotizacionResponse(BigDecimal distanciaKm, BigDecimal costoTotal, BigDecimal montoSena) {
        this.distanciaKm = distanciaKm;
        this.costoTotal = costoTotal;
        this.montoSena = montoSena;
    }

    public BigDecimal getDistanciaKm() { return distanciaKm; }
    public void setDistanciaKm(BigDecimal distanciaKm) { this.distanciaKm = distanciaKm; }

    public BigDecimal getCostoTotal() { return costoTotal; }
    public void setCostoTotal(BigDecimal costoTotal) { this.costoTotal = costoTotal; }

    public BigDecimal getMontoSena() { return montoSena; }
    public void setMontoSena(BigDecimal montoSena) { this.montoSena = montoSena; }
}
