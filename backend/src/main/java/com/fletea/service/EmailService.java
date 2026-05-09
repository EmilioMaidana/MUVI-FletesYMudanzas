package com.fletea.service;

import com.fletea.model.Reserva;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Envío de emails transaccionales (cotización + comprobante de pago).
 *
 * Los métodos son @Async: se ejecutan en el thread pool de Spring sin bloquear
 * la respuesta HTTP. Si el SMTP no está configurado (dev/test), el bean
 * JavaMailSender no existe y el envío se omite con un log informativo.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private static final Locale LOCALE_AR = new Locale("es", "AR");
    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("EEEE dd 'de' MMMM 'de' yyyy", LOCALE_AR);
    private static final DateTimeFormatter TIME_FMT =
            DateTimeFormatter.ofPattern("HH:mm");

    /** ObjectProvider permite que el bean sea opcional (no rompe si SMTP no está configurado). */
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    @Value("${admin.email:}")
    private String adminEmail;

    public EmailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

    // -------------------------------------------------------------------------
    // Público
    // -------------------------------------------------------------------------

    /**
     * Email de cotización enviado al crear la reserva.
     * Incluye detalles del flete y el link de pago de MercadoPago.
     */
    @Async
    public void enviarResumenReserva(Reserva reserva, String initPoint) {
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            log.info("SMTP no configurado — email de cotización omitido (reserva #{})", reserva.getId());
            return;
        }
        try {
            String html = buildQuoteHtml(reserva, initPoint);
            String subject = "Fletea #" + reserva.getId() + " · Tu cotización está lista";
            send(sender, reserva.getEmail(), subject, html);
            log.info("Email cotización enviado a {} (reserva #{})", reserva.getEmail(), reserva.getId());
        } catch (Exception e) {
            log.error("Error enviando email cotización (reserva #{}): {}", reserva.getId(), e.getMessage(), e);
        }
    }

    /**
     * Comprobante de pago enviado al confirmar el webhook de MercadoPago.
     */
    @Async
    public void enviarComprobantePago(Reserva reserva) {
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            log.info("SMTP no configurado — comprobante omitido (reserva #{})", reserva.getId());
            return;
        }
        try {
            String html = buildPaymentHtml(reserva);
            String subject = "Fletea #" + reserva.getId() + " · Seña acreditada ✓";
            send(sender, reserva.getEmail(), subject, html);
            log.info("Comprobante enviado a {} (reserva #{})", reserva.getEmail(), reserva.getId());
        } catch (Exception e) {
            log.error("Error enviando comprobante (reserva #{}): {}", reserva.getId(), e.getMessage(), e);
        }
    }

    /**
     * Notificación interna enviada al admin cuando se acredita una seña.
     */
    @Async
    public void enviarNotificacionAdminPagoRecibido(Reserva reserva) {
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) return;

        String to = adminEmail != null && !adminEmail.isBlank() ? adminEmail : fromAddress;
        if (to == null || to.isBlank()) return;

        try {
            String subject = "🔔 NUEVO PAGO RECIBIDO: Flete #" + reserva.getId() + " - " + reserva.getNombreCompleto();
            String html = buildAdminNotificationHtml(reserva);
            send(sender, to, subject, html);
            log.info("Notificación a admin enviada a {}", to);
        } catch (Exception e) {
            log.error("Error enviando notificación a admin (reserva #{}): {}", reserva.getId(), e.getMessage(), e);
        }
    }

    // -------------------------------------------------------------------------
    // Privado — envío
    // -------------------------------------------------------------------------

    private void send(JavaMailSender sender, String to, String subject, String html) throws Exception {
        MimeMessage msg = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
        String from = fromAddress != null && !fromAddress.isBlank()
                ? "Fletea <" + fromAddress + ">"
                : "Fletea <noreply@fletea.com.ar>";
        helper.setFrom(from);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(html, true);
        sender.send(msg);
    }

    // -------------------------------------------------------------------------
    // Privado — formateo
    // -------------------------------------------------------------------------

    private String formatPesos(BigDecimal amount) {
        if (amount == null) return "—";
        NumberFormat nf = NumberFormat.getNumberInstance(LOCALE_AR);
        nf.setMaximumFractionDigits(0);
        nf.setMinimumFractionDigits(0);
        return "$ " + nf.format(amount);
    }

    private String capitalize(String s) {
        if (s == null || s.isBlank()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    // -------------------------------------------------------------------------
    // Privado — templates HTML
    // -------------------------------------------------------------------------

    private String buildQuoteHtml(Reserva r, String initPoint) {
        String fecha = r.getFecha() != null ? capitalize(DATE_FMT.format(r.getFecha())) : "—";
        String hora  = r.getHora()  != null ? TIME_FMT.format(r.getHora()) + " hs" : "—";

        return "<!DOCTYPE html>" +
            "<html lang=\"es\">" +
            "<head>" +
            "<meta charset=\"UTF-8\"/>" +
            "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\"/>" +
            "<title>Tu cotización Fletea</title>" +
            "</head>" +
            "<body style=\"margin:0;padding:0;background-color:#0d0d0d;" +
                "font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;\">" +

            wrap(
                header("Reserva #" + r.getId()) +
                "<tr><td style=\"background-color:#181818;padding:28px 36px;\">" +

                    // Saludo
                    "<p style=\"margin:0 0 6px;font-size:17px;font-weight:600;color:#f0f0f0;\">Hola, " +
                        esc(r.getNombreCompleto()) + " 👋</p>" +
                    "<p style=\"margin:0 0 28px;font-size:14px;color:#999;line-height:1.7;\">" +
                        "Recibimos tu solicitud de flete. Revisá los detalles y abonando la seña " +
                        "confirmás tu reserva.</p>" +

                    // Detalles
                    sectionTitle("Detalles del flete") +
                    detailCard(new String[][]{
                        {"Origen",  esc(r.getOrigen())},
                        {"Destino", esc(r.getDestino())},
                        {"Fecha",   fecha},
                        {"Hora",    hora}
                    }, true) +

                    // Cotización
                    sectionTitle("Cotización") +
                    "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" " +
                        "style=\"background-color:#222;border-radius:8px;margin-bottom:28px;\">" +
                    "<tr><td style=\"padding:14px 20px;border-bottom:1px solid #2a2a2a;\">" +
                        "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr>" +
                        "<td><span style=\"font-size:13px;color:#888;\">Costo total estimado</span></td>" +
                        "<td align=\"right\"><span style=\"font-size:14px;color:#e8e8e8;\">" +
                            formatPesos(r.getCostoTotal()) + "</span></td>" +
                        "</tr></table>" +
                    "</td></tr>" +
                    "<tr><td style=\"padding:16px 20px;\">" +
                        "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr>" +
                        "<td><span style=\"font-size:14px;font-weight:600;color:#e8e8e8;\">Seña a abonar ahora</span></td>" +
                        "<td align=\"right\"><span style=\"font-size:20px;font-weight:700;color:#4ade80;\">" +
                            formatPesos(r.getMontoSena()) + "</span></td>" +
                        "</tr></table>" +
                    "</td></tr>" +
                    "</table>" +

                    // Botón CTA
                    "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" " +
                        "style=\"margin-bottom:28px;\">" +
                    "<tr><td align=\"center\">" +
                        "<a href=\"" + esc(initPoint) + "\" " +
                           "style=\"display:inline-block;background-color:#4ade80;color:#0d0d0d;" +
                                  "font-size:15px;font-weight:700;text-decoration:none;" +
                                  "padding:14px 36px;border-radius:8px;\">" +
                            "Abonar seña con MercadoPago" +
                        "</a>" +
                    "</td></tr></table>" +

                    "<p style=\"margin:0;font-size:13px;color:#555;line-height:1.7;\">" +
                        "¿Tenés alguna consulta? Respondé este email o escribinos directamente.</p>" +

                "</td></tr>" +
                footer()
            ) +

            "</body></html>";
    }

    private String buildPaymentHtml(Reserva r) {
        String fecha = r.getFecha() != null ? capitalize(DATE_FMT.format(r.getFecha())) : "—";
        String hora  = r.getHora()  != null ? TIME_FMT.format(r.getHora()) + " hs" : "—";

        return "<!DOCTYPE html>" +
            "<html lang=\"es\">" +
            "<head>" +
            "<meta charset=\"UTF-8\"/>" +
            "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\"/>" +
            "<title>Seña acreditada - Fletea</title>" +
            "</head>" +
            "<body style=\"margin:0;padding:0;background-color:#0d0d0d;" +
                "font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;\">" +

            wrap(
                header("Reserva #" + r.getId()) +
                "<tr><td style=\"background-color:#181818;padding:28px 36px;\">" +

                    // Ícono de confirmación
                    "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" " +
                        "style=\"margin-bottom:24px;\">" +
                    "<tr><td align=\"center\">" +
                        "<div style=\"display:inline-block;width:56px;height:56px;line-height:56px;" +
                             "border-radius:50%;background-color:#1a3a2a;text-align:center;" +
                             "font-size:26px;\">✅</div>" +
                    "</td></tr></table>" +

                    // Título
                    "<p style=\"margin:0 0 6px;font-size:20px;font-weight:700;color:#4ade80;text-align:center;\">" +
                        "¡Seña acreditada!</p>" +
                    "<p style=\"margin:0 0 28px;font-size:14px;color:#999;line-height:1.7;text-align:center;\">" +
                        "Hola <strong style=\"color:#e8e8e8;\">" + esc(r.getNombreCompleto()) + "</strong>, " +
                        "tu reserva quedó confirmada. Muchas gracias.</p>" +

                    // Resumen de la reserva
                    sectionTitle("Tu reserva") +
                    detailCard(new String[][]{
                        {"Origen",  esc(r.getOrigen())},
                        {"Destino", esc(r.getDestino())},
                        {"Fecha",   fecha},
                        {"Hora",    hora}
                    }, true) +

                    // Monto pagado
                    sectionTitle("Pago") +
                    "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" " +
                        "style=\"background-color:#1a3a2a;border-radius:8px;margin-bottom:28px;" +
                               "border:1px solid #2a5a3a;\">" +
                    "<tr><td style=\"padding:18px 20px;\">" +
                        "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr>" +
                        "<td><span style=\"font-size:14px;font-weight:600;color:#e8e8e8;\">Seña abonada</span></td>" +
                        "<td align=\"right\"><span style=\"font-size:20px;font-weight:700;color:#4ade80;\">" +
                            formatPesos(r.getMontoSena()) + "</span></td>" +
                        "</tr></table>" +
                    "</td></tr></table>" +

                    // Próximos pasos
                    "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" " +
                        "style=\"background-color:#1c1c1c;border-radius:8px;border-left:3px solid #4ade80;" +
                               "margin-bottom:20px;\">" +
                    "<tr><td style=\"padding:18px 20px;\">" +
                        "<p style=\"margin:0 0 8px;font-size:13px;font-weight:700;color:#4ade80;" +
                            "text-transform:uppercase;letter-spacing:1px;\">¿Qué sigue?</p>" +
                        "<p style=\"margin:0;font-size:14px;color:#bbb;line-height:1.7;\">" +
                            "Nos pondremos en contacto con vos en las próximas horas para coordinar " +
                            "la visita previa al flete y confirmar todos los detalles del traslado.</p>" +
                    "</td></tr></table>" +

                    "<p style=\"margin:0;font-size:13px;color:#555;line-height:1.7;\">" +
                        "¿Tenés alguna consulta? Respondé este email y te ayudamos.</p>" +

                "</td></tr>" +
                footer()
            ) +

            "</body></html>";
    }

    private String buildAdminNotificationHtml(Reserva r) {
        String fecha = r.getFecha() != null ? capitalize(DATE_FMT.format(r.getFecha())) : "—";
        String hora  = r.getHora()  != null ? TIME_FMT.format(r.getHora()) + " hs" : "—";

        return "<!DOCTYPE html>" +
            "<html lang=\"es\"><body>" +
            "<h2 style=\"color:#4ade80;\">¡Nuevo cliente confirmado! 🚚</h2>" +
            "<p>El cliente <b>" + esc(r.getNombreCompleto()) + "</b> ha abonado la seña de <b>" + formatPesos(r.getMontoSena()) + "</b>.</p>" +
            "<ul>" +
            "<li><b>Teléfono:</b> " + esc(r.getTelefono()) + "</li>" +
            "<li><b>Email:</b> " + esc(r.getEmail()) + "</li>" +
            "<li><b>Origen:</b> " + esc(r.getOrigen()) + "</li>" +
            "<li><b>Destino:</b> " + esc(r.getDestino()) + "</li>" +
            "<li><b>Fecha:</b> " + fecha + " a las " + hora + "</li>" +
            "<li><b>Costo Total:</b> " + formatPesos(r.getCostoTotal()) + "</li>" +
            "</ul>" +
            "<p><a href=\"https://www.fletea.com.ar/admin\">Ver en el Panel de Administración</a></p>" +
            "</body></html>";
    }

    // -------------------------------------------------------------------------
    // Privado — bloques de HTML reutilizables
    // -------------------------------------------------------------------------

    private String wrap(String content) {
        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" " +
                    "style=\"background-color:#0d0d0d;padding:40px 16px;\">" +
               "<tr><td align=\"center\">" +
               "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" " +
                    "style=\"max-width:580px;\">" +
               content +
               "</table></td></tr></table>";
    }

    private String header(String subtitle) {
        return "<tr><td style=\"background-color:#181818;border-radius:12px 12px 0 0;" +
                    "padding:26px 36px 22px;border-bottom:1px solid #252525;\">" +
               "<span style=\"font-size:22px;font-weight:700;color:#f0f0f0;letter-spacing:-0.5px;\">Fletea</span>" +
               "<span style=\"font-size:12px;color:#555;display:block;margin-top:4px;" +
                    "letter-spacing:1.5px;text-transform:uppercase;\">" + subtitle + "</span>" +
               "</td></tr>";
    }

    private String footer() {
        return "<tr><td style=\"background-color:#111;border-radius:0 0 12px 12px;" +
                    "padding:18px 36px;border-top:1px solid #252525;\">" +
               "<p style=\"margin:0;font-size:12px;color:#444;text-align:center;\">" +
                    "Fletea &middot; fleteaflete@gmail.com &middot; fletea.com.ar</p>" +
               "<p style=\"margin:6px 0 0;font-size:11px;color:#333;text-align:center;\">" +
                    "Este email fue generado automáticamente al operar en fletea.com.ar</p>" +
               "</td></tr>";
    }

    private String sectionTitle(String title) {
        return "<p style=\"margin:0 0 10px;font-size:11px;font-weight:700;color:#555;" +
                    "text-transform:uppercase;letter-spacing:1.5px;\">" + title + "</p>";
    }

    /**
     * Tabla de filas clave-valor con separadores.
     * @param rows   array de [label, value]
     * @param spaced true = margen inferior
     */
    private String detailCard(String[][] rows, boolean spaced) {
        StringBuilder sb = new StringBuilder();
        sb.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" ")
          .append("style=\"background-color:#222;border-radius:8px;")
          .append(spaced ? "margin-bottom:16px;" : "").append("\">");

        for (int i = 0; i < rows.length; i++) {
            boolean last = i == rows.length - 1;
            sb.append("<tr><td style=\"padding:13px 20px;")
              .append(last ? "" : "border-bottom:1px solid #2a2a2a;").append("\">")
              .append("<span style=\"font-size:12px;color:#666;\">").append(rows[i][0]).append("</span><br/>")
              .append("<span style=\"font-size:14px;color:#e8e8e8;\">").append(rows[i][1]).append("</span>")
              .append("</td></tr>");
        }

        sb.append("</table>");
        return sb.toString();
    }

    /** Escapa caracteres HTML básicos para evitar XSS en el template. */
    private String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
