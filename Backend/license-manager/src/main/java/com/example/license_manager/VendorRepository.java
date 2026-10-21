package com.example.license_manager;

import org.springframework.data.jpa.repository.JpaRepository;

// An interface only. Spring generates the working code at startup.
// JpaRepository<Vendor, Long> = "manage Vendor objects whose id type is Long".
public interface VendorRepository extends JpaRepository<Vendor, Long> {

    // Spring builds these queries from the method names alone.
    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}