package com.example.license_manager;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "Current password is required.") String currentPassword,
        // BCrypt only uses the first 72 bytes, so we cap the length there.
        @NotBlank(message = "New password is required.")
        @Size(min = 8, max = 72, message = "New password must be 8 to 72 characters.")
        String newPassword) {
}