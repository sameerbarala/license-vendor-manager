package com.example.license_manager;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return userRepository.findAll(Sort.by("id")).stream().map(UserResponse::from).toList();
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        String username = request.username().trim();
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ConflictException("A user with this username already exists.");
        }
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateRole(Long id, UpdateRoleRequest request) {
        User user = find(id);
        if ("ADMIN".equals(user.getRole()) && !request.role().equals("ADMIN")) {
            requireAnotherAdmin();
        }
        user.setRole(request.role());
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void resetPassword(Long id, ResetPasswordRequest request) {
        User user = find(id);
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void delete(Long id, String currentUsername) {
        User user = find(id);
        if (user.getUsername().equals(currentUsername)) {
            throw new BadRequestException("You cannot delete your own account.");
        }
        if ("ADMIN".equals(user.getRole())) {
            requireAnotherAdmin();
        }
        userRepository.delete(user);
    }

    private User find(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }

    // Called before removing an admin's admin rights: someone else must stay admin.
    private void requireAnotherAdmin() {
        if (userRepository.countByRole("ADMIN") <= 1) {
            throw new BadRequestException("At least one admin must remain.");
        }
    }
}