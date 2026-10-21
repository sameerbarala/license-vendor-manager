package com.example.license_manager;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LicenseService {

    private final LicenseRepository licenseRepository;
    private final VendorRepository vendorRepository;

    public LicenseService(LicenseRepository licenseRepository, VendorRepository vendorRepository) {
        this.licenseRepository = licenseRepository;
        this.vendorRepository = vendorRepository;
    }

    @Transactional(readOnly = true)
    public List<License> findAll() {
        return licenseRepository.findAll(Sort.by("id"));
    }

    @Transactional(readOnly = true)
    public License findById(Long id) {
        return licenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("License not found."));
    }

    @Transactional
    public License create(LicenseRequest request) {
        Vendor vendor = checkRules(request);
        License license = new License();
        copyFields(request, license, vendor);
        return licenseRepository.save(license);
    }

    @Transactional
    public License update(Long id, LicenseRequest request) {
        License existing = findById(id);
        Vendor vendor = checkRules(request);
        copyFields(request, existing, vendor);
        return licenseRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        licenseRepository.delete(findById(id));
    }

    // Single-field rules are annotations on LicenseRequest. This handles the rules
    // that need the database or more than one field, and returns the vendor it found.
    private Vendor checkRules(LicenseRequest request) {
        boolean perpetual = request.getLicenseType().equals("Perpetual");
        if (!perpetual && request.getExpiryDate() == null) {
            throw new BadRequestException(
                    "Expiry date is required for Subscription and Trial licenses.");
        }
        return vendorRepository.findById(request.getVendorId())
                .orElseThrow(() -> new BadRequestException("Vendor not found."));
    }

    private void copyFields(LicenseRequest from, License to, Vendor vendor) {
        boolean perpetual = from.getLicenseType().equals("Perpetual");
        to.setName(from.getName());
        to.setLicenseType(from.getLicenseType());
        to.setSeats(from.getSeats());
        to.setCost(from.getCost());
        // A Perpetual license never expires, so any date sent is ignored.
        to.setExpiryDate(perpetual ? null : from.getExpiryDate());
        to.setVendor(vendor);
    }
}