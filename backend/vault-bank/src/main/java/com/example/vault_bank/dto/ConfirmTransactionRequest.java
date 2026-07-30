package com.example.vault_bank.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ConfirmTransactionRequest {

    @NotBlank(message = "Confirmation code is required")
    private String code; // Simulating OTP entry (e.g. "123456" for demo simplicity)
}