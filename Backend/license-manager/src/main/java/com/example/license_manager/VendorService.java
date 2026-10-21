package com.example.license_manager;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// @Service: business logic lives here. The controller calls it; it calls the repositories.
// @Transactional: each method's database work succeeds or fails as one unit.
@Service
public class VendorService {

    private final VendorRepository vendorRepository;
    private final LicenseRepository licenseRepository;

    public VendorService(VendorRepository vendorRepository, LicenseRepository licenseRepository) {
        this.vendorRepository = vendorRepository;
        this.licenseRepository = licenseRepository;
    }

    @Transactional(readOnly = true)
    public List<Vendor> findAll() {
        return vendorRepository.findAll(Sort.by("id"));
    }

    @Transactional(readOnly = true)
    public Vendor findById(Long id) {
        return vendorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found."));
    }

    @Transactional
    public Vendor create(VendorRequest request) {
        if (vendorRepository.existsByNameIgnoreCase(request.getName())) {
            throw new ConflictException("A vendor with this name already exists.");
        }
        Vendor vendor = new Vendor();
        copyFields(request, vendor);
        return vendorRepository.save(vendor);
    }

    @Transactional
    public Vendor update(Long id, VendorRequest request) {
        Vendor existing = findById(id);
        if (vendorRepository.existsByNameIgnoreCaseAndIdNot(request.getName(), id)) {
            throw new ConflictException("A vendor with this name already exists.");
        }
        copyFields(request, existing);
        return vendorRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        Vendor existing = findById(id);
        if (licenseRepository.existsByVendorId(id)) {
            throw new ConflictException("This vendor still has licenses. Delete those licenses first.");
        }
        vendorRepository.delete(existing);
    }

    private void copyFields(VendorRequest from, Vendor to) {
        to.setName(from.getName());
        to.setEmail(from.getEmail());
        to.setCategory(from.getCategory());
        to.setStatus(from.getStatus());
    }
}