package com.fletea.config;

import com.fletea.service.JwtService;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Filtro que protege los endpoints de admin (GET /api/reservas).
 * Los endpoints públicos (POST /api/cotizacion, POST /api/reservas,
 * POST /api/payments/webhook, /api/auth/*) NO requieren token.
 */
@Component
@Order(1)
public class JwtAuthFilter implements Filter {

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        String path = request.getRequestURI();
        String method = request.getMethod();

        // Solo proteger GET /api/reservas (listado admin)
        boolean isProtected = path.equals("/api/reservas") && "GET".equalsIgnoreCase(method);

        if (!isProtected) {
            chain.doFilter(req, res);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Token no proporcionado\"}");
            return;
        }

        String token = authHeader.substring(7);
        String username = jwtService.validateTokenAndGetUsername(token);

        if (username == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Token inválido o expirado\"}");
            return;
        }

        // Token válido — continuar
        chain.doFilter(req, res);
    }
}
