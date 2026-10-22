package com.example.license_manager;

// Wrong credentials -> 401
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}