package com.example.vault_bank.controller;

import com.example.vault_bank.dto.InterestRateRequest;
import com.example.vault_bank.entity.InterestRate;
import com.example.vault_bank.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/interest-rates")
    public ResponseEntity<List<InterestRate>> getRates() {
        return ResponseEntity.ok(adminService.getAllRates());
    }

    @PutMapping("/interest-rates/{id}")
    public ResponseEntity<?> updateRate(@PathVariable Long id, @Valid @RequestBody InterestRateRequest request) {
        try {
            InterestRate updated = adminService.updateInterestRate(id, request);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}