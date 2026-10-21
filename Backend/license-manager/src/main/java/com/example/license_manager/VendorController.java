package com.example.license_manager;

import java.util.List;
import java.util.regex.Pattern;

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
@RequestMapping("/api/vendors")
public class VendorController {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final VendorRepository vendorRepository;
    private final LicenseRepository licenseRepository;

    // Constructor injection: Spring sees this constructor and passes in the repositories.
    public VendorController(VendorRepository vendorRepository, LicenseRepository licenseRepository) {
        this.vendorRepository = vendorRepository;
        this.licenseRepository = licenseRepository;
    }

    // GET /api/vendors -> all vendors, ordered by id
    @GetMapping
    public List<Vendor> getAll() {
        return vendorRepository.findAll(Sort.by("id"));
    }

    // GET /api/vendors/3 -> one vendor
    @GetMapping("/{id}")
    public Vendor getById(@PathVariable Long id) {
        return findOrThrow(id);
    }

    // POST /api/vendors -> create
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Vendor create(@RequestBody Vendor input) {
        validate(input, null);

        Vendor vendor = new Vendor();
        copyFields(input, vendor);
        return vendorRepository.save(vendor); // INSERT; the returned object has the new id
    }

    // PUT /api/vendors/3 -> update
    @PutMapping("/{id}")
    public Vendor update(@PathVariable Long id, @RequestBody Vendor input) {
        Vendor existing = findOrThrow(id);
        validate(input, id);
        copyFields(input, existing);
        return vendorRepository.save(existing); // UPDATE, because the id already exists
    }

    // DELETE /api/vendors/3 -> remove
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        Vendor existing = findOrThrow(id);
        if (licenseRepository.existsByVendorId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This vendor still has licenses. Delete those licenses first.");
        }
        vendorRepository.delete(existing);
    }

    // ---------- helper methods ----------

    private Vendor findOrThrow(Long id) {
        return vendorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Vendor not found."));
    }

    private void validate(Vendor input, Long ignoreId) {
        String name = input.getName() == null ? "" : input.getName().trim();
        String email = input.getEmail() == null ? "" : input.getEmail().trim();
        String category = input.getCategory() == null ? "" : input.getCategory().trim();
        String status = input.getStatus() == null ? "" : input.getStatus().trim();

        if (name.isEmpty()) {
            throw badRequest("Vendor name is required.");
        }
        if (email.isEmpty()) {
            throw badRequest("Contact email is required.");
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw badRequest("Please enter a valid email address.");
        }
        if (category.isEmpty()) {
            throw badRequest("Category is required.");
        }
        if (!status.equals("Active") && !status.equals("Inactive")) {
            throw badRequest("Status must be Active or Inactive.");
        }

        // The database does the duplicate check now.
        boolean duplicate = (ignoreId == null)
                ? vendorRepository.existsByNameIgnoreCase(name)
                : vendorRepository.existsByNameIgnoreCaseAndIdNot(name, ignoreId);
        if (duplicate) {
            throw badRequest("A vendor with this name already exists.");
        }
    }

    private void copyFields(Vendor from, Vendor to) {
        to.setName(from.getName().trim());
        to.setEmail(from.getEmail().trim());
        to.setCategory(from.getCategory().trim());
        to.setStatus(from.getStatus().trim());
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}