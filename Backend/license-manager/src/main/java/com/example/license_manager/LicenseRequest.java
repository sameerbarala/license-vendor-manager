package com.example.license_manager;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class LicenseRequest {

    @NotBlank(message = "License name is required.")
    private String name;

    @NotNull(message = "License type must be Subscription, Perpetual or Trial.")
    @Pattern(regexp = "Subscription|Perpetual|Trial",
             message = "License type must be Subscription, Perpetual or Trial.")
    private String licenseType;

    @NotNull(message = "Seats must be at least 1.")
    @Min(value = 1, message = "Seats must be at least 1.")
    private Integer seats;

    @NotNull(message = "Cost must be 0 or more.")
    @DecimalMin(value = "0", message = "Cost must be 0 or more.")
    private BigDecimal cost;

    // The rule "required unless Perpetual" depends on two fields, so it lives in LicenseService.
    private LocalDate expiryDate;

    @NotNull(message = "Vendor is required.")
    private Long vendorId;

    public LicenseRequest() {
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name == null ? null : name.trim(); }

    public String getLicenseType() { return licenseType; }
    public void setLicenseType(String licenseType) {
        this.licenseType = licenseType == null ? null : licenseType.trim();
    }

    public Integer getSeats() { return seats; }
    public void setSeats(Integer seats) { this.seats = seats; }

    public BigDecimal getCost() { return cost; }
    public void setCost(BigDecimal cost) { this.cost = cost; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public Long getVendorId() { return vendorId; }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }
}