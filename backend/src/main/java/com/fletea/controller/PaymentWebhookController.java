package com.fletea.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fletea.service.MercadoPagoService;
import com.fletea.service.ReservaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentWebhookController {

    private static final Logger log = LoggerFactory.getLogger(PaymentWebhookController.class);

    private final ReservaService reservaService;
    private final MercadoPagoService mercadoPagoService;

    public PaymentWebhookController(ReservaService reservaService,
                                     MercadoPagoService mercadoPagoService) {
        this.reservaService = reservaService;
        this.mercadoPagoService = mercadoPagoService;
    }

    /**
     * Webhook que recibe notificaciones de MercadoPago.
     *
     * Formatos posibles:
     *   IPN:     { "topic": "payment", "id": 123456 }
     *   Webhook: { "action": "payment.created", "type": "payment", "data": { "id": "123456" } }
     *
     * En ambos casos hay que consultar la API de MP para obtener status y external_reference.
     */
    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(@RequestBody JsonNode body,
                                               @RequestParam(value = "topic", required = false) String topicParam,
                                               @RequestParam(value = "id", required = false) String idParam) {
        log.info("Webhook recibido — body: {}", body.toString());

        Long paymentId = extractPaymentId(body, topicParam, idParam);

        if (paymentId == null) {
            log.info("Notificación ignorada (no es de pago o sin ID)");
            return ResponseEntity.ok().build();
        }

        try {
            var payment = mercadoPagoService.obtenerInfoPago(paymentId);

            String status = payment.getStatus();
            String externalRef = payment.getExternalReference();

            log.info("Pago #{} — status: {}, reserva: {}", paymentId, status, externalRef);

            if ("approved".equals(status) && externalRef != null && !externalRef.isEmpty()) {
                reservaService.confirmarPago(externalRef, paymentId.toString());
                log.info("Reserva {} confirmada exitosamente", externalRef);
            } else {
                log.info("Pago #{} status: {} — no se actualiza reserva", paymentId, status);
            }
        } catch (Exception e) {
            log.error("Error procesando pago #{}: {}", paymentId, e.getMessage(), e);
        }

        // Siempre 200 para que MercadoPago no reintente
        return ResponseEntity.ok().build();
    }

    /**
     * Extrae el paymentId de los distintos formatos que envía MercadoPago:
     *
     * 1. Webhook V2: body.data.id (string o number)
     * 2. IPN via query params: ?topic=payment&id=123456
     * 3. IPN via body: body.topic == "payment" && body.id
     */
    private Long extractPaymentId(JsonNode body, String topicParam, String idParam) {
        // Formato Webhook V2: { "type": "payment", "data": { "id": ... } }
        String type = body.path("type").asText("");
        if ("payment".equals(type)) {
            JsonNode dataId = body.path("data").path("id");
            if (!dataId.isMissingNode()) {
                try {
                    // data.id puede venir como número o string
                    return dataId.isNumber() ? dataId.asLong() : Long.parseLong(dataId.asText());
                } catch (NumberFormatException e) {
                    log.warn("data.id inválido: {}", dataId.asText());
                }
            }
        }

        // Formato IPN query params: ?topic=payment&id=123456
        if ("payment".equals(topicParam) && idParam != null) {
            try {
                return Long.parseLong(idParam);
            } catch (NumberFormatException e) {
                log.warn("Query param id inválido: {}", idParam);
            }
        }

        // Formato IPN body: { "topic": "payment", "id": 123456 }
        String bodyTopic = body.path("topic").asText("");
        if ("payment".equals(bodyTopic)) {
            JsonNode idNode = body.path("id");
            if (!idNode.isMissingNode()) {
                try {
                    return idNode.isNumber() ? idNode.asLong() : Long.parseLong(idNode.asText());
                } catch (NumberFormatException e) {
                    log.warn("body.id inválido: {}", idNode.asText());
                }
            }
        }

        return null;
    }
}
