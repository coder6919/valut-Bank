package com.example.vault_bank.controller;

import com.example.vault_bank.dto.AccountCreateRequest;
import com.example.vault_bank.dto.AccountResponse;
import com.example.vault_bank.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping
    public ResponseEntity<?> openAccount(@Valid @RequestBody AccountCreateRequest request, Principal principal) {
        try {
            AccountResponse response = accountService.createAccount(request, principal.getName());
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping
    public ResponseEntity<List<AccountResponse>> getMyAccounts(Principal principal) {
        List<AccountResponse> accounts = accountService.getAccountsForUser(principal.getName());
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAccountDetail(@PathVariable Long id, Principal principal) {
        try {
            AccountResponse response = accountService.getAccountById(id, principal.getName());
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }
}