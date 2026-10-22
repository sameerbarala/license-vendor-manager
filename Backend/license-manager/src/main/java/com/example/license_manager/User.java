package com.example.license_manager;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

// The table is "app_users" because "user" is a reserved word in PostgreSQL.
@Entity
@Table(name = "app_users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    // Stores the BCrypt hash, never the real password.
    @Column(nullable = false)
    private String passwordHash;

    public User() {
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    // "ADMIN" or "VIEWER"
    @Column
    private String role;

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}