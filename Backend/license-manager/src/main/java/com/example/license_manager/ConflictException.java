package com.example.license_manager;

// The request clashes with existing data (duplicate, still in use) -> 409
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}