package com.example.license_manager;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank(message = "Username is required.")
        @Size(min = 3, max = 50, message = "Username must be 3 to 50 characters.")
        String username,
        @NotBlank(message = "Password is required.")
        @Size(min = 8, max = 72, message = "Password must be 8 to 72 characters.")
        String password,
        @NotBlank(message = "Role is required.")
        @Pattern(regexp = "ADMIN|VIEWER", message = "Role must be ADMIN or VIEWER.")
        String role) {
}