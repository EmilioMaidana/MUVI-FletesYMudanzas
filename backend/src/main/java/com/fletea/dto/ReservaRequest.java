package com.fletea.dto;

import jakarta.validation.constraints.*;

public class ReservaRequest {

    @NotBlank
    private String nombreCompleto;

    @NotBlank
    private String telefono;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String origen;

    @NotBlank
    private String destino;

    @NotBlank
    private String fecha;

    @NotBlank
    private String hora;

    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getOrigen() { return origen; }
    public void setOrigen(String origen) { this.origen = origen; }

    public String getDestino() { return destino; }
    public void setDestino(String destino) { this.destino = destino; }

    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }

    public String getHora() { return hora; }
    public void setHora(String hora) { this.hora = hora; }
}
