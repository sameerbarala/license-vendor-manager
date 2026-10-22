package com.example.license_manager;

import java.util.List;

import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// @WebMvcTest starts only the web layer (controllers, validation, error handler).
// No database and no real services are involved.
@WebMvcTest(VendorController.class)
@AutoConfigureMockMvc(addFilters = false)
class VendorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private VendorService vendorService;
    @MockitoBean
    private JwtService jwtService;
    @MockitoBean
    private UserRepository userRepository;

    @Test
    void getAllReturnsVendorsAsJson() throws Exception {
        Vendor vendor = new Vendor();
        vendor.setId(1L);
        vendor.setName("Microsoft");
        vendor.setEmail("sales@microsoft.com");
        vendor.setCategory("Software");
        vendor.setStatus("Active");
        when(vendorService.findAll()).thenReturn(List.of(vendor));

        mockMvc.perform(get("/api/vendors"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Microsoft"))
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    void postWithValidBodyReturns201() throws Exception {
        Vendor saved = new Vendor();
        saved.setId(7L);
        saved.setName("Oracle");
        when(vendorService.create(any(VendorRequest.class))).thenReturn(saved);

        String body = """
                {"name":"Oracle","email":"a@oracle.com","category":"Cloud","status":"Active"}
                """;

        mockMvc.perform(post("/api/vendors").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(7));
    }

    @Test
    void postWithBadFieldsReturns400AndFieldMessages() throws Exception {
        String body = """
                {"name":"","email":"abc","category":"","status":"Maybe"}
                """;

        mockMvc.perform(post("/api/vendors").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors.name").value("Vendor name is required."))
                .andExpect(jsonPath("$.errors.email").value("Please enter a valid email address."))
                .andExpect(jsonPath("$.errors.status").value("Status must be Active or Inactive."));
    }

    @Test
    void duplicateNameReturns409WithMessage() throws Exception {
        when(vendorService.create(any(VendorRequest.class)))
                .thenThrow(new ConflictException("A vendor with this name already exists."));

        String body = """
                {"name":"Oracle","email":"a@oracle.com","category":"Cloud","status":"Active"}
                """;

        mockMvc.perform(post("/api/vendors").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("A vendor with this name already exists."));
    }

    @Test
    void missingVendorReturns404() throws Exception {
        when(vendorService.findById(99L)).thenThrow(new ResourceNotFoundException("Vendor not found."));

        mockMvc.perform(get("/api/vendors/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Vendor not found."));
    }
}