package com.muvi.service;

/**
 * Pure algorithmic pricing function for Muvi moving service.
 *
 * Model:  price = max(P_min, C_base + C_dist + C_time)
 *
 *   C_dist = d * (a + b / (d + k))        — nonlinear distance cost
 *   h      = h_min + d / v                 — estimated hours
 *   C_time = h * C_hora                    — time cost
 *
 * No hardcoded zones. Everything derived mathematically from distance.
 */
public final class PricingEngine {

    private static final double C_BASE = 20_000;

    private static final double A = 2_500;
    private static final double B = 12_000;
    private static final double K = 4;

    private static final double H_MIN = 2;
    private static final double V = 12;

    private static final double C_HORA = 15_000;

    private static final double P_MIN = 50_000;

    /** Optimization factor — applied uniformly to make the final price 15% cheaper. */
    private static final double DISCOUNT_FACTOR = 0.85;

    private PricingEngine() {}

    public static double calculateQuote(double distanceKm) {
        // 1. Clamp distance to minimum 1 km
        double d = Math.max(1.0, distanceKm);

        // 2. Nonlinear distance cost
        double cDist = d * (A + (B / (d + K)));

        // 3. Estimated hours
        double h = H_MIN + (d / V);

        // 4. Time cost
        double cTime = h * C_HORA;

        // 5. Sum all components
        double rawPrice = C_BASE + cDist + cTime;

        // 6. Apply minimum price floor
        double price = Math.max(P_MIN, rawPrice);

        // 7. Apply 15% optimization
        price *= DISCOUNT_FACTOR;

        // 8. Round to nearest 1000
        return Math.round(price / 1_000.0) * 1_000.0;
    }
}
