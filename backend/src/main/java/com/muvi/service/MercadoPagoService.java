package com.muvi.service;

import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.preference.*;
import com.mercadopago.resources.preference.Preference;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class MercadoPagoService {

    @Value("${mercadopago.access-token}")
    private String accessToken;

    @Value("${mercadopago.notification-url}")
    private String notificationUrl;

    @PostConstruct
    public void init() {
        MercadoPagoConfig.setAccessToken(accessToken);
    }

    public Preference crearPreferencia(Long reservaId, BigDecimal monto) {
        PreferenceItemRequest item = PreferenceItemRequest.builder()
                .title("Seña - Flete Muvi #" + reservaId)
                .quantity(1)
                .unitPrice(monto)
                .currencyId("ARS")
                .build();

        PreferenceBackUrlsRequest backUrls = PreferenceBackUrlsRequest.builder()
                .success("http://localhost:4200/pago-exitoso")
                .failure("http://localhost:4200/pago-fallido")
                .pending("http://localhost:4200/pago-pendiente")
                .build();

        PreferenceRequest request = PreferenceRequest.builder()
                .items(List.of(item))
                .backUrls(backUrls)
                .autoReturn("approved")
                .notificationUrl(notificationUrl)
                .externalReference(reservaId.toString())
                .build();

        try {
            PreferenceClient client = new PreferenceClient();
            return client.create(request);
        } catch (Exception e) {
            throw new RuntimeException("Error al crear preferencia de Mercado Pago: " + e.getMessage(), e);
        }
    }
}
