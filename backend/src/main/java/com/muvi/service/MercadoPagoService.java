package com.muvi.service;

import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.preference.*;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.resources.preference.Preference;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class MercadoPagoService {

    private static final Logger log = LoggerFactory.getLogger(MercadoPagoService.class);

    @Value("${mercadopago.access-token}")
    private String accessToken;

    @Value("${mercadopago.notification-url}")
    private String notificationUrl;

    @Value("${muvi.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    @PostConstruct
    public void init() {
        MercadoPagoConfig.setAccessToken(accessToken);
        log.info("MercadoPago SDK inicializado — frontendUrl: {}", frontendUrl);
    }

    /**
     * Crea una preferencia de pago en MercadoPago para cobrar la seña de una reserva.
     */
    public Preference crearPreferencia(Long reservaId, BigDecimal monto) {
        PreferenceItemRequest item = PreferenceItemRequest.builder()
                .title("Seña - Flete Muvi #" + reservaId)
                .quantity(1)
                .unitPrice(monto)
                .currencyId("ARS")
                .build();

        String successUrl = frontendUrl + "/pago-exitoso";
        String failureUrl = frontendUrl + "/pago-fallido";
        String pendingUrl = frontendUrl + "/pago-pendiente";

        PreferenceBackUrlsRequest backUrls = PreferenceBackUrlsRequest.builder()
                .success(successUrl)
                .failure(failureUrl)
                .pending(pendingUrl)
                .build();

        // autoReturn solo funciona con URLs públicas (no localhost)
        boolean isLocalhost = frontendUrl.contains("localhost") || frontendUrl.contains("127.0.0.1");

        PreferenceRequest.PreferenceRequestBuilder builder = PreferenceRequest.builder()
                .items(List.of(item))
                .backUrls(backUrls)
                .notificationUrl(notificationUrl)
                .externalReference(reservaId.toString());

        if (!isLocalhost) {
            builder.autoReturn("approved");
        }

        PreferenceRequest request = builder.build();

        try {
            PreferenceClient client = new PreferenceClient();
            Preference preference = client.create(request);
            log.info("Preferencia creada — id: {}, initPoint: {}", preference.getId(), preference.getInitPoint());
            return preference;
        } catch (MPApiException e) {
            log.error("[MercadoPago] HTTP {} — body: {}", e.getStatusCode(), e.getApiResponse().getContent());
            throw new RuntimeException("Error al crear preferencia de Mercado Pago [HTTP " + e.getStatusCode() + "]: " + e.getApiResponse().getContent(), e);
        } catch (Exception e) {
            log.error("[MercadoPago] Error inesperado al crear preferencia: {}", e.getMessage(), e);
            throw new RuntimeException("Error al crear preferencia de Mercado Pago: " + e.getMessage(), e);
        }
    }

    /**
     * Consulta los detalles de un pago en MercadoPago.
     * Se usa desde el webhook para obtener status y external_reference.
     */
    public Payment obtenerInfoPago(Long paymentId) {
        try {
            PaymentClient client = new PaymentClient();
            Payment payment = client.get(paymentId);
            log.info("Pago consultado — id: {}, status: {}, ref: {}",
                    payment.getId(), payment.getStatus(), payment.getExternalReference());
            return payment;
        } catch (MPApiException e) {
            log.error("[MercadoPago] HTTP {} — body: {}", e.getStatusCode(), e.getApiResponse().getContent());
            throw new RuntimeException("Error al consultar pago #" + paymentId + " [HTTP " + e.getStatusCode() + "]: " + e.getApiResponse().getContent(), e);
        } catch (Exception e) {
            log.error("[MercadoPago] Error inesperado al consultar pago: {}", e.getMessage(), e);
            throw new RuntimeException("Error al consultar pago #" + paymentId + ": " + e.getMessage(), e);
        }
    }
}
