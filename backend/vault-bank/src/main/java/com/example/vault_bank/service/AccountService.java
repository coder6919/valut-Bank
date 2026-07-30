package com.example.vault_bank.service;

import com.example.vault_bank.dto.AccountCreateRequest;
import com.example.vault_bank.dto.AccountResponse;
import com.example.vault_bank.entity.*;
import com.example.vault_bank.repository.AccountRepository;
import com.example.vault_bank.repository.InterestRateRepository;
import com.example.vault_bank.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final InterestRateRepository interestRateRepository;

    public AccountService(AccountRepository accountRepository,
                          UserRepository userRepository,
                          InterestRateRepository interestRateRepository) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.interestRateRepository = interestRateRepository;
    }

    @Transactional
    public AccountResponse createAccount(AccountCreateRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User context not found"));

        // Generate clean 12-digit random account number
        String accountNumber = generateUniqueAccountNumber();

        Account.AccountBuilder accountBuilder = Account.builder()
                .accountNumber(accountNumber)
                .type(request.getType())
                .balance(BigDecimal.ZERO)
                .user(user);

        if (request.getType() == AccountType.SAVINGS) {
            // Find system interest rate profile, or fall back to default
            InterestRate interestRate = interestRateRepository.findByAccountType(AccountType.SAVINGS)
                    .orElseGet(() -> interestRateRepository.save(
                            InterestRate.builder()
                                    .accountType(AccountType.SAVINGS)
                                    .ratePercent(new BigDecimal("4.50")) // Seed baseline fallback
                                    .effectiveFrom(LocalDateTime.now())
                                    .build()
                    ));
            accountBuilder.interestRate(interestRate);
        }

        Account savedAccount = accountRepository.save(accountBuilder.build());
        return mapToResponse(savedAccount);
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> getAccountsForUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User context not found"));

        return accountRepository.findByUserId(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AccountResponse getAccountById(Long accountId, String email) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        // Security check: Verify that the authenticated user owns this account
        if (!account.getUser().getEmail().equals(email)) {
            throw new SecurityException("Unauthorized access to account history");
        }

        return mapToResponse(account);
    }

    private String generateUniqueAccountNumber() {
        Random random = new Random();
        String accountNumber;
        do {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 12; i++) {
                sb.append(random.nextInt(10));
            }
            accountNumber = sb.toString();
        } while (accountRepository.existsByAccountNumber(accountNumber));
        return accountNumber;
    }

    private AccountResponse mapToResponse(Account account) {
        BigDecimal rate = null;
        if (account.getType() == AccountType.SAVINGS && account.getInterestRate() != null) {
            rate = account.getInterestRate().getRatePercent();
        }
        return AccountResponse.builder()
                .id(account.getId())
                .accountNumber(account.getAccountNumber())
                .type(account.getType())
                .balance(account.getBalance())
                .interestRatePercent(rate)
                .createdAt(account.getCreatedAt())
                .build();
    }
}