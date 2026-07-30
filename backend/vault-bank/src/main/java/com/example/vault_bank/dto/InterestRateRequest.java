package com.example.vault_bank.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Getter
@Setter
public class InterestRateRequest {

    @NotNull(message = "Rate percent is required")
    @DecimalMin(value = "0.00", message = "Rate percent cannot be negative")
    @DecimalMax(value = "25.00", message = "Rate percent cannot exceed 25.00%")
    private BigDecimal ratePercent;
}