package com.example.license_manager;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LicenseRepository extends JpaRepository<License, Long> {

    // Spring reads this name as: "is there any license whose vendor's id equals this?"
    boolean existsByVendorId(Long vendorId);
}