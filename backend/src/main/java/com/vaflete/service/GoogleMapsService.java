package com.vaflete.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;

@Service
public class GoogleMapsService {

    private static final Logger log = LoggerFactory.getLogger(GoogleMapsService.class);

    @Value("${google.maps.api-key}")
    private String apiKey;

    @Value("${vaflete.base-address}")
    private String baseAddress;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Calcula la distancia total de la ruta cerrada usando Directions API con waypoints:
     * Origin: Base (Adolfo Alsina 2034)
     * Waypoint 1: Origen (recogida del cliente)
     * Waypoint 2: Destino (entrega del cliente)
     * Destination: Base (retorno a Adolfo Alsina 2034)
     *
     * Esto genera UNA sola ruta continua con la distancia real de manejo.
     */
    public BigDecimal calcularDistanciaRutaCerrada(String origen, String destino) {
        log.info("Calculando ruta cerrada con Directions API:");
        log.info("  Base: {}", baseAddress);
        log.info("  Parada 1 (Recogida): {}", origen);
        log.info("  Parada 2 (Entrega): {}", destino);
        log.info("  Retorno: {}", baseAddress);

        URI url = UriComponentsBuilder
                .fromHttpUrl("https://maps.googleapis.com/maps/api/directions/json")
                .queryParam("origin", baseAddress)
                .queryParam("destination", baseAddress)
                .queryParam("waypoints", origen + "|" + destino)
                .queryParam("mode", "driving")
                .queryParam("language", "es")
                .queryParam("units", "metric")
                .queryParam("key", apiKey)
                .build()
                .toUri();

        try {
            String response = restTemplate.getForObject(url, String.class);
            log.debug("Directions API response: {}", response);

            JsonNode root = objectMapper.readTree(response);

            String status = root.path("status").asText();
            if (!"OK".equals(status)) {
                String errorMsg = root.path("error_message").asText("Sin detalle");
                log.error("Directions API error - Status: {}, Message: {}", status, errorMsg);
                throw new RuntimeException(
                        "Error de Google Maps API: " + status + " - " + errorMsg);
            }

            JsonNode routes = root.path("routes");
            if (routes.isEmpty()) {
                throw new RuntimeException("No se encontró una ruta viable para el recorrido solicitado.");
            }

            // Sum all legs of the route
            JsonNode legs = routes.get(0).path("legs");
            long totalMetros = 0;

            for (int i = 0; i < legs.size(); i++) {
                JsonNode leg = legs.get(i);
                long legMetros = leg.path("distance").path("value").asLong();
                String legText = leg.path("distance").path("text").asText();
                String startAddr = leg.path("start_address").asText();
                String endAddr = leg.path("end_address").asText();

                totalMetros += legMetros;
                log.info("  Tramo {}: {} -> {} = {}", i + 1, startAddr, endAddr, legText);
            }

            BigDecimal km = BigDecimal.valueOf(totalMetros)
                    .divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP);

            log.info("  TOTAL: {} km", km);
            return km;

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error al consultar Directions API: {}", e.getMessage(), e);
            throw new RuntimeException("Error al consultar Google Maps: " + e.getMessage(), e);
        }
    }
}
