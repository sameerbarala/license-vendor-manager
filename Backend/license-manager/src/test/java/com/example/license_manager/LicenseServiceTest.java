package com.example.license_manager;

import java.math.BigDecimal;
import java.time.LocalDate;
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

@ExtendWith(MockitoExtension.class)
class LicenseServiceTest {

    @Mock
    private LicenseRepository licenseRepository;

    @Mock
    private VendorRepository vendorRepository;

    @InjectMocks
    private LicenseService licenseService;

    private LicenseRequest request(String type, LocalDate expiry) {
        LicenseRequest request = new LicenseRequest();
        request.setName("Microsoft 365");
        request.setLicenseType(type);
        request.setSeats(10);
        request.setCost(new BigDecimal("500.00"));
        request.setExpiryDate(expiry);
        request.setVendorId(1L);
        return request;
    }

    @Test
    void createSubscriptionLinksVendorAndKeepsExpiry() {
        Vendor vendor = new Vendor();
        when(vendorRepository.findById(1L)).thenReturn(Optional.of(vendor));
        when(licenseRepository.save(any(License.class))).thenAnswer(call -> call.getArgument(0));

        License saved = licenseService.create(request("Subscription", LocalDate.of(2027, 3, 31)));

        assertThat(saved.getVendor()).isSameAs(vendor);
        assertThat(saved.getExpiryDate()).isEqualTo(LocalDate.of(2027, 3, 31));
        assertThat(saved.getSeats()).isEqualTo(10);
    }

    @Test
    void createPerpetualIgnoresAnyExpiryDate() {
        when(vendorRepository.findById(1L)).thenReturn(Optional.of(new Vendor()));
        when(licenseRepository.save(any(License.class))).thenAnswer(call -> call.getArgument(0));

        License saved = licenseService.create(request("Perpetual", LocalDate.of(2027, 3, 31)));

        assertThat(saved.getExpiryDate()).isNull();
    }

    @Test
    void createRejectsSubscriptionWithoutExpiry() {
        assertThatThrownBy(() -> licenseService.create(request("Subscription", null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Expiry date is required for Subscription and Trial licenses.");

        verify(licenseRepository, never()).save(any());
    }

    @Test
    void createRejectsTrialWithoutExpiry() {
        assertThatThrownBy(() -> licenseService.create(request("Trial", null)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void createRejectsUnknownVendor() {
        when(vendorRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> licenseService.create(request("Trial", LocalDate.of(2027, 1, 1))))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Vendor not found.");
    }

    @Test
    void findByIdThrowsWhenMissing() {
        when(licenseRepository.findById(5L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> licenseService.findById(5L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("License not found.");
    }

    @Test
    void updateChangesFieldsOfExistingLicense() {
        License existing = new License();
        existing.setSeats(1);
        when(licenseRepository.findById(2L)).thenReturn(Optional.of(existing));
        when(vendorRepository.findById(1L)).thenReturn(Optional.of(new Vendor()));
        when(licenseRepository.save(any(License.class))).thenAnswer(call -> call.getArgument(0));

        License updated = licenseService.update(2L, request("Subscription", LocalDate.of(2027, 6, 30)));

        assertThat(updated).isSameAs(existing);
        assertThat(updated.getSeats()).isEqualTo(10);
        assertThat(updated.getName()).isEqualTo("Microsoft 365");
    }
}