package com.example.vault_bank.controller;

import com.example.vault_bank.dto.*;
import com.example.vault_bank.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping("/deposit")
    public ResponseEntity<?> deposit(@Valid @RequestBody TransactionRequest request) {
        try {
            TransactionResponse response = transactionService.deposit(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(@Valid @RequestBody TransactionRequest request, Principal principal) {
        try {
            TransactionResponse response = transactionService.withdraw(request, principal.getName());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/transfer")
    public ResponseEntity<?> transfer(@Valid @RequestBody TransferRequest request, Principal principal) {
        try {
            TransactionResponse response = transactionService.transfer(request, principal.getName());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirmTransaction(@PathVariable Long id,
                                                @Valid @RequestBody ConfirmTransactionRequest request,
                                                Principal principal) {
        try {
            TransactionResponse response = transactionService.confirmTransaction(id, request, principal.getName());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<?> getHistory(@PathVariable Long accountId,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "10") int size,
                                        Principal principal) {
        try {
            Page<TransactionResponse> history = transactionService.getAccountHistory(accountId, page, size, principal.getName());
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}