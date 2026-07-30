package com.example.vault_bank.dto;

import com.example.vault_bank.entity.AccountType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AccountCreateRequest {
    @NotNull(message = "Account type is required")
    private AccountType type; // SAVINGS or CURRENT
}