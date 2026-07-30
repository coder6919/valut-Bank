package com.example.vault_bank.scheduler;

import com.example.vault_bank.entity.*;
import com.example.vault_bank.repository.AccountRepository;
import com.example.vault_bank.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Component
public class InterestAccrualScheduler {

    private static final Logger log = LoggerFactory.getLogger(InterestAccrualScheduler.class);

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    public InterestAccrualScheduler(AccountRepository accountRepository,
                                    TransactionRepository transactionRepository) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
    }

    /**
     * Executes daily or monthly to calculate and credit interest to savings accounts.
     * Uses properties configuration.
     */
    @Scheduled(cron = "${app.interest.cron}")
    @Transactional
    public void accrueInterest() {
        log.info("Starting background interest accrual engine...");

        // Fetch all registered accounts
        List<Account> accounts = accountRepository.findAll();

        // Define the current day's start as our boundary to prevent double calculation
        LocalDateTime startOfToday = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);

        for (Account account : accounts) {
            // Apply interest calculations only to SAVINGS accounts
            if (account.getType() == AccountType.SAVINGS) {

                // Fetch rate
                InterestRate rateProfile = account.getInterestRate();
                if (rateProfile == null || rateProfile.getRatePercent().compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }

                // IDEMPOTENCY CHECK: Ensure interest hasn't already been credited today
                boolean alreadyAccrued = transactionRepository.existsByAccountIdAndTypeAndTimestampAfter(
                        account.getId(),
                        TransactionType.INTEREST,
                        startOfToday
                );

                if (alreadyAccrued) {
                    log.warn("Account {} already received interest today. Bypassing.", account.getAccountNumber());
                    continue;
                }

                BigDecimal balance = account.getBalance();
                if (balance.compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }

                // Calculation logic:
                // Daily Interest = (Balance * (RatePercent / 100)) / 365 days
                BigDecimal rateDecimal = rateProfile.getRatePercent().divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP);
                BigDecimal yearlyInterest = balance.multiply(rateDecimal);
                BigDecimal dailyInterest = yearlyInterest.divide(new BigDecimal("365"), 6, RoundingMode.HALF_UP)
                        .setScale(2, RoundingMode.HALF_UP); // Rounded to standard cents representation

                if (dailyInterest.compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }

                // Update ledger balance
                account.setBalance(account.getBalance().add(dailyInterest));
                accountRepository.save(account);

                // Create a clear transaction history audit log
                Transaction interestTx = Transaction.builder()
                        .type(TransactionType.INTEREST)
                        .amount(dailyInterest)
                        .status(TransactionStatus.COMPLETED)
                        .notes("Daily Interest Accrual " + rateProfile.getRatePercent() + "%")
                        .account(account)
                        .build();

                transactionRepository.save(interestTx);
                log.info("Accrued interest of ${} successfully to Account {}", dailyInterest, account.getAccountNumber());
            }
        }
        log.info("Interest accrual process finished successfully.");
    }
}