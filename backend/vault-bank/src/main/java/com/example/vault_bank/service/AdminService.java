package com.example.vault_bank.service;

import com.example.vault_bank.dto.InterestRateRequest;
import com.example.vault_bank.entity.AccountType;
import com.example.vault_bank.entity.InterestRate;
import com.example.vault_bank.repository.InterestRateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AdminService {

    private final InterestRateRepository interestRateRepository;

    public AdminService(InterestRateRepository interestRateRepository) {
        this.interestRateRepository = interestRateRepository;
    }

    @Transactional(readOnly = true)
    public List<InterestRate> getAllRates() {
        return interestRateRepository.findAll();
    }

    @Transactional
    public InterestRate updateInterestRate(Long id, InterestRateRequest request) {
        InterestRate rate = interestRateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Interest rate configuration not found"));

        rate.setRatePercent(request.getRatePercent());
        rate.setEffectiveFrom(LocalDateTime.now());

        return interestRateRepository.save(rate);
    }
}