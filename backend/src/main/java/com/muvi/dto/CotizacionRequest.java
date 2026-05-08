package com.muvi.dto;

import jakarta.validation.constraints.NotBlank;

public class CotizacionRequest {

    @NotBlank
    private String origen;

    @NotBlank
    private String destino;

    public String getOrigen() { return origen; }
    public void setOrigen(String origen) { this.origen = origen; }

    public String getDestino() { return destino; }
    public void setDestino(String destino) { this.destino = destino; }
}
