package com.example.license_manager;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateRoleRequest(
        @NotBlank(message = "Role is required.")
        @Pattern(regexp = "ADMIN|VIEWER", message = "Role must be ADMIN or VIEWER.")
        String role) {
}