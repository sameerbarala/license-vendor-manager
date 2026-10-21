package com.example.license_manager;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/licenses")
public class LicenseController {

    private static final Set<String> LICENSE_TYPES = Set.of("Subscription", "Perpetual", "Trial");

    private final LicenseRepository licenseRepository;
    private final VendorRepository vendorRepository;

    public LicenseController(LicenseRepository licenseRepository,
                             VendorRepository vendorRepository) {
        this.licenseRepository = licenseRepository;
        this.vendorRepository = vendorRepository;
    }

    @GetMapping
    public List<License> getAll() {
        return licenseRepository.findAll(Sort.by("id"));
    }

    @GetMapping("/{id}")
    public License getById(@PathVariable Long id) {
        return findOrThrow(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public License create(@RequestBody LicenseRequest request) {
        Vendor vendor = validate(request);

        License license = new License();
        copyFields(request, license, vendor);
        return licenseRepository.save(license);
    }

    @PutMapping("/{id}")
    public License update(@PathVariable Long id, @RequestBody LicenseRequest request) {
        License existing = findOrThrow(id);
        Vendor vendor = validate(request);
        copyFields(request, existing, vendor);
        return licenseRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        licenseRepository.delete(findOrThrow(id));
    }

    // ---------- helper methods ----------

    private License findOrThrow(Long id) {
        return licenseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "License not found."));
    }

    // Checks every rule and returns the Vendor the license belongs to.
    private Vendor validate(LicenseRequest request) {
        String name = request.getName() == null ? "" : request.getName().trim();
        String type = request.getLicenseType() == null ? "" : request.getLicenseType().trim();

        if (name.isEmpty()) {
            throw badRequest("License name is required.");
        }
        if (!LICENSE_TYPES.contains(type)) {
            throw badRequest("License type must be Subscription, Perpetual or Trial.");
        }
        if (request.getSeats() == null || request.getSeats() < 1) {
            throw badRequest("Seats must be at least 1.");
        }
        if (request.getCost() == null || request.getCost().compareTo(BigDecimal.ZERO) < 0) {
            throw badRequest("Cost must be 0 or more.");
        }
        if (!type.equals("Perpetual") && request.getExpiryDate() == null) {
            throw badRequest("Expiry date is required for Subscription and Trial licenses.");
        }
        if (request.getVendorId() == null) {
            throw badRequest("Vendor is required.");
        }
        return vendorRepository.findById(request.getVendorId())
                .orElseThrow(() -> badRequest("Vendor not found."));
    }

    private void copyFields(LicenseRequest from, License to, Vendor vendor) {
        String type = from.getLicenseType().trim();
        to.setName(from.getName().trim());
        to.setLicenseType(type);
        to.setSeats(from.getSeats());
        to.setCost(from.getCost());
        // A Perpetual license never expires, so any date sent is ignored.
        to.setExpiryDate(type.equals("Perpetual") ? null : from.getExpiryDate());
        to.setVendor(vendor);
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}