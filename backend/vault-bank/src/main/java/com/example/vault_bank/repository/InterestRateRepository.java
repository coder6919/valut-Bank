package com.example.vault_bank.repository;

import com.example.vault_bank.entity.AccountType;
import com.example.vault_bank.entity.InterestRate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InterestRateRepository extends JpaRepository<InterestRate, Long> {
    Optional<InterestRate> findByAccountType(AccountType accountType);
}