package com.example.vault_bank.dto;

import com.example.vault_bank.entity.AccountType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class AccountResponse {
    private Long id;
    private String accountNumber;
    private AccountType type;
    private BigDecimal balance;
    private BigDecimal interestRatePercent; // Nullable for CURRENT accounts
    private LocalDateTime createdAt;
}