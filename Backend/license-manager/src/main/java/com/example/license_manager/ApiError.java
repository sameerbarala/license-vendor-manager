package com.example.license_manager;

import java.time.Instant;
import java.util.Map;

// The one JSON shape every error uses. A record is a compact class for plain data.
public record ApiError(
        int status,
        String error,
        String message,
        Map<String, String> errors,   // field name -> problem (only for validation errors)
        String timestamp) {

    public static ApiError of(int status, String error, String message, Map<String, String> errors) {
        return new ApiError(status, error, message, errors, Instant.now().toString());
    }
}