package com.example.vault_bank.dto;

import com.example.vault_bank.entity.TransactionStatus;
import com.example.vault_bank.entity.TransactionType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
public class TransactionResponse {
    private Long id;
    private TransactionType type;
    private BigDecimal amount;
    private TransactionStatus status;
    private String notes;
    private String sourceAccountNumber;
    private String recipientAccountNumber; // Nullable (Only transfers)
    private LocalDateTime timestamp;
    private List<String> triggerReasons; // List of flag descriptions if flagged
}