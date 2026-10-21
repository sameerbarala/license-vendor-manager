package com.example.license_manager;

// The request breaks a business rule -> 400
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}