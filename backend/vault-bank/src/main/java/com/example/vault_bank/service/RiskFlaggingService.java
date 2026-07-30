package com.example.vault_bank.service;

import com.example.vault_bank.entity.*;
import com.example.vault_bank.repository.TransactionFlagRepository;
import com.example.vault_bank.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class RiskFlaggingService {

    private final TransactionRepository transactionRepository;
    private final TransactionFlagRepository transactionFlagRepository;

    public RiskFlaggingService(TransactionRepository transactionRepository,
                               TransactionFlagRepository transactionFlagRepository) {
        this.transactionRepository = transactionRepository;
        this.transactionFlagRepository = transactionFlagRepository;
    }

    /**
     * Evaluates security rules on a pending withdrawal/transfer.
     * Writes flag logs to database if rules are breached.
     * Returns true if flagged, false otherwise.
     */
    @Transactional
    public boolean evaluateTransactionRisk(Transaction transaction) {
        Account sourceAccount = transaction.getAccount();
        BigDecimal amount = transaction.getAmount();
        List<TransactionFlag> triggeredFlags = new ArrayList<>();

        // RULE 1: Flag if amount exceeds 80% of current balance (LARGE_AMOUNT)
        BigDecimal ruleOneThreshold = sourceAccount.getBalance().multiply(new BigDecimal("0.80"));
        if (amount.compareTo(ruleOneThreshold) > 0) {
            triggeredFlags.add(TransactionFlag.builder()
                    .transaction(transaction)
                    .reason(FlagReason.LARGE_AMOUNT)
                    .resolved(false)
                    .build());
        }

        // RULE 2: Flag if 3+ transactions occur within a 5-minute window (RAPID_SUCCESSION)
        LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);
        long recentTxCount = transactionRepository.countRecentTransactions(sourceAccount.getId(), fiveMinutesAgo);
        if (recentTxCount >= 3) {
            triggeredFlags.add(TransactionFlag.builder()
                    .transaction(transaction)
                    .reason(FlagReason.RAPID_SUCCESSION)
                    .resolved(false)
                    .build());
        }

        // RULE 3: Flag if a transfer is going to a recipient for the first time (NEW_RECIPIENT)
        if (transaction.getType() == TransactionType.TRANSFER && transaction.getRelatedAccount() != null) {
            long completedTransfersCount = transactionRepository.countCompletedTransfersToRecipient(
                    sourceAccount.getId(),
                    transaction.getRelatedAccount().getId()
            );
            if (completedTransfersCount == 0) {
                triggeredFlags.add(TransactionFlag.builder()
                        .transaction(transaction)
                        .reason(FlagReason.NEW_RECIPIENT)
                        .resolved(false)
                        .build());
            }
        }

        // Persist all triggered flags and link to the transaction
        if (!triggeredFlags.isEmpty()) {
            transactionFlagRepository.saveAll(triggeredFlags);
            transaction.setFlags(triggeredFlags);
            return true;
        }

        return false;
    }
}