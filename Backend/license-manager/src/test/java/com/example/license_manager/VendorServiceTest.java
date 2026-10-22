package com.example.license_manager;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

// MockitoExtension creates fake ("mock") repositories, so no database is needed.
@ExtendWith(MockitoExtension.class)
class VendorServiceTest {

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private LicenseRepository licenseRepository;

    // The real VendorService, built with the mocks above.
    @InjectMocks
    private VendorService vendorService;

    private VendorRequest validRequest() {
        VendorRequest request = new VendorRequest();
        request.setName("Microsoft");
        request.setEmail("sales@microsoft.com");
        request.setCategory("Software");
        request.setStatus("Active");
        return request;
    }

    @Test
    void createSavesVendorWhenNameIsNew() {
        when(vendorRepository.existsByNameIgnoreCase("Microsoft")).thenReturn(false);
        // Return the same object that was saved.
        when(vendorRepository.save(any(Vendor.class))).thenAnswer(call -> call.getArgument(0));

        Vendor saved = vendorService.create(validRequest());

        assertThat(saved.getName()).isEqualTo("Microsoft");
        assertThat(saved.getEmail()).isEqualTo("sales@microsoft.com");
        assertThat(saved.getStatus()).isEqualTo("Active");
    }

    @Test
    void createRejectsDuplicateName() {
        when(vendorRepository.existsByNameIgnoreCase("Microsoft")).thenReturn(true);

        assertThatThrownBy(() -> vendorService.create(validRequest()))
                .isInstanceOf(ConflictException.class)
                .hasMessage("A vendor with this name already exists.");

        verify(vendorRepository, never()).save(any());
    }

    @Test
    void findByIdThrowsWhenMissing() {
        when(vendorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> vendorService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Vendor not found.");
    }

    @Test
    void updateRejectsNameUsedByAnotherVendor() {
        when(vendorRepository.findById(1L)).thenReturn(Optional.of(new Vendor()));
        when(vendorRepository.existsByNameIgnoreCaseAndIdNot("Microsoft", 1L)).thenReturn(true);

        assertThatThrownBy(() -> vendorService.update(1L, validRequest()))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void deleteIsBlockedWhenVendorHasLicenses() {
        when(vendorRepository.findById(1L)).thenReturn(Optional.of(new Vendor()));
        when(licenseRepository.existsByVendorId(1L)).thenReturn(true);

        assertThatThrownBy(() -> vendorService.delete(1L))
                .isInstanceOf(ConflictException.class)
                .hasMessage("This vendor still has licenses. Delete those licenses first.");

        verify(vendorRepository, never()).delete(any());
    }

    @Test
    void deleteRemovesVendorWithoutLicenses() {
        Vendor vendor = new Vendor();
        when(vendorRepository.findById(1L)).thenReturn(Optional.of(vendor));
        when(licenseRepository.existsByVendorId(1L)).thenReturn(false);

        vendorService.delete(1L);

        verify(vendorRepository).delete(vendor);
    }
}