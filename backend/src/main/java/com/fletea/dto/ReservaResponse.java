package com.fletea.dto;

import java.math.BigDecimal;

public class ReservaResponse {

    private Long id;
    private String initPoint;
    private BigDecimal montoSena;

    public ReservaResponse() {}

    public ReservaResponse(Long id, String initPoint, BigDecimal montoSena) {
        this.id = id;
        this.initPoint = initPoint;
        this.montoSena = montoSena;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getInitPoint() { return initPoint; }
    public void setInitPoint(String initPoint) { this.initPoint = initPoint; }

    public BigDecimal getMontoSena() { return montoSena; }
    public void setMontoSena(BigDecimal montoSena) { this.montoSena = montoSena; }
}
