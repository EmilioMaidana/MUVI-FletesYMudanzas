package com.muvi.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.muvi.service.ReservaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/payments")
public class PaymentWebhookController {

    private final ReservaService reservaService;
    private final RestTemplate restTemplate = new RestTemplate();

    public PaymentWebhookController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(@RequestBody JsonNode body) {
        String type = body.path("type").asText();

        if ("payment".equals(type)) {
            String paymentId = body.path("data").path("id").asText();
            String externalReference = body.path("external_reference").asText();

            if (!externalReference.isEmpty()) {
                reservaService.confirmarPago(externalReference, paymentId);
            }
        }

        return ResponseEntity.ok().build();
    }
}
