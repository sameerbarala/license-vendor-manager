package com.example.license_manager;

import java.math.BigDecimal;
import java.time.LocalDate;

// What the client SENDS when creating or updating a license.
// It carries only vendorId (a number), not a whole vendor object.
// Keeping "what comes in" separate from "what is stored" is a common professional pattern.
public class LicenseRequest {

    private String name;
    private String licenseType;
    private Integer seats;
    private BigDecimal cost;
    private LocalDate expiryDate;
    private Long vendorId;

    public LicenseRequest() {
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLicenseType() { return licenseType; }
    public void setLicenseType(String licenseType) { this.licenseType = licenseType; }

    public Integer getSeats() { return seats; }
    public void setSeats(Integer seats) { this.seats = seats; }

    public BigDecimal getCost() { return cost; }
    public void setCost(BigDecimal cost) { this.cost = cost; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public Long getVendorId() { return vendorId; }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }
}