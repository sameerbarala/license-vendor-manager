package com.example.license_manager;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

// What the client sends for a vendor. Annotations declare the rules, so the
// controller no longer needs a block of if-statements.
public class VendorRequest {

    @NotBlank(message = "Vendor name is required.")
    private String name;

    // First alternative lets a blank value through so only @NotBlank reports it.
    @NotBlank(message = "Contact email is required.")
    @Pattern(regexp = "^\\s*$|^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
             message = "Please enter a valid email address.")
    private String email;

    @NotBlank(message = "Category is required.")
    private String category;

    @NotBlank(message = "Status is required.")
    @Pattern(regexp = "^(Active|Inactive|)$", message = "Status must be Active or Inactive.")
    private String status;

    public VendorRequest() {
    }

    // The setters trim text as the JSON is read, so validation sees trimmed values.
    public String getName() { return name; }
    public void setName(String name) { this.name = trim(name); }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = trim(email); }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = trim(category); }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = trim(status); }

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }
}