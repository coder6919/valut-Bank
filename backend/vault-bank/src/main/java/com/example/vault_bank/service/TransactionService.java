package com.example.vault_bank.service;

import com.example.vault_bank.dto.*;
import com.example.vault_bank.entity.*;
import com.example.vault_bank.repository.AccountRepository;
import com.example.vault_bank.repository.TransactionFlagRepository;
import com.example.vault_bank.repository.TransactionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final RiskFlaggingService riskFlaggingService;
    private final TransactionFlagRepository transactionFlagRepository;

    public TransactionService(TransactionRepository transactionRepository,
                              AccountRepository accountRepository,
                              RiskFlaggingService riskFlaggingService,
                              TransactionFlagRepository transactionFlagRepository) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.riskFlaggingService = riskFlaggingService;
        this.transactionFlagRepository = transactionFlagRepository;
    }

    @Transactional
    public TransactionResponse deposit(TransactionRequest request) {
        Account account = accountRepository.findByAccountNumber(request.getAccountNumber())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        // Deposits bypass the risk engine and credit instantly
        account.setBalance(account.getBalance().add(request.getAmount()));
        accountRepository.save(account);

        Transaction transaction = Transaction.builder()
                .type(TransactionType.DEPOSIT)
                .amount(request.getAmount())
                .status(TransactionStatus.COMPLETED)
                .notes(request.getNotes() != null ? request.getNotes() : "Deposit")
                .account(account)
                .build();

        Transaction savedTx = transactionRepository.save(transaction);
        return mapToResponse(savedTx);
    }

    @Transactional
    public TransactionResponse withdraw(TransactionRequest request, String email) {
        Account account = accountRepository.findByAccountNumber(request.getAccountNumber())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        validateOwnership(account, email);

        if (account.getBalance().compareTo(request.getAmount()) < 0) {
            throw new IllegalArgumentException("Insufficient funds available");
        }

        // Initialize transaction structure in PENDING status
        Transaction transaction = Transaction.builder()
                .type(TransactionType.WITHDRAW)
                .amount(request.getAmount())
                .status(TransactionStatus.PENDING)
                .notes(request.getNotes())
                .account(account)
                .build();

        // Evaluate security risks
        boolean isFlagged = riskFlaggingService.evaluateTransactionRisk(transaction);

        if (isFlagged) {
            transaction.setStatus(TransactionStatus.FLAGGED);
            Transaction savedTx = transactionRepository.save(transaction);
            return mapToResponse(savedTx);
        }

        // If safe, deduct balance and mark completed immediately
        account.setBalance(account.getBalance().subtract(request.getAmount()));
        accountRepository.save(account);

        transaction.setStatus(TransactionStatus.COMPLETED);
        Transaction savedTx = transactionRepository.save(transaction);
        return mapToResponse(savedTx);
    }

    @Transactional
    public TransactionResponse transfer(TransferRequest request, String email) {
        Account source = accountRepository.findByAccountNumber(request.getSourceAccountNumber())
                .orElseThrow(() -> new IllegalArgumentException("Source account not found"));

        Account recipient = accountRepository.findByAccountNumber(request.getRecipientAccountNumber())
                .orElseThrow(() -> new IllegalArgumentException("Recipient account not found"));

        validateOwnership(source, email);

        if (source.getId().equals(recipient.getId())) {
            throw new IllegalArgumentException("Cannot transfer to the same account");
        }

        if (source.getBalance().compareTo(request.getAmount()) < 0) {
            throw new IllegalArgumentException("Insufficient funds available");
        }

        // Initialize transaction context
        Transaction transaction = Transaction.builder()
                .type(TransactionType.TRANSFER)
                .amount(request.getAmount())
                .status(TransactionStatus.PENDING)
                .notes(request.getNotes())
                .account(source)
                .relatedAccount(recipient)
                .build();

        // Evaluate security risks
        boolean isFlagged = riskFlaggingService.evaluateTransactionRisk(transaction);

        if (isFlagged) {
            transaction.setStatus(TransactionStatus.FLAGGED);
            Transaction savedTx = transactionRepository.save(transaction);
            return mapToResponse(savedTx);
        }

        // Execute ledger transfers if safe
        source.setBalance(source.getBalance().subtract(request.getAmount()));
        recipient.setBalance(recipient.getBalance().add(request.getAmount()));

        accountRepository.save(source);
        accountRepository.save(recipient);

        transaction.setStatus(TransactionStatus.COMPLETED);
        Transaction savedTx = transactionRepository.save(transaction);
        return mapToResponse(savedTx);
    }

    @Transactional
    public TransactionResponse confirmTransaction(Long id, ConfirmTransactionRequest request, String email) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Transaction record not found"));

        validateOwnership(transaction.getAccount(), email);

        if (transaction.getStatus() != TransactionStatus.FLAGGED) {
            throw new IllegalStateException("Transaction is not flagged or pending confirmation");
        }

        // Validate Simulated OTP code
        if (!"123456".equals(request.getCode())) {
            transaction.setStatus(TransactionStatus.REJECTED);
            transactionRepository.save(transaction);
            throw new IllegalArgumentException("Invalid verification code. Transaction rejected.");
        }

        Account source = transaction.getAccount();
        BigDecimal amount = transaction.getAmount();

        // Double check balance right before executing
        if (source.getBalance().compareTo(amount) < 0) {
            transaction.setStatus(TransactionStatus.REJECTED);
            transactionRepository.save(transaction);
            throw new IllegalArgumentException("Execution failed due to insufficient funds.");
        }

        // Execute transactions depending on type
        if (transaction.getType() == TransactionType.WITHDRAW) {
            source.setBalance(source.getBalance().subtract(amount));
            accountRepository.save(source);
        } else if (transaction.getType() == TransactionType.TRANSFER) {
            Account recipient = transaction.getRelatedAccount();
            source.setBalance(source.getBalance().subtract(amount));
            recipient.setBalance(recipient.getBalance().add(amount));
            accountRepository.save(source);
            accountRepository.save(recipient);
        }

        // Mark Transaction Completed
        transaction.setStatus(TransactionStatus.COMPLETED);

        // Resolve risk flags
        List<TransactionFlag> flags = transactionFlagRepository.findByTransactionId(transaction.getId());
        for (TransactionFlag flag : flags) {
            flag.setResolved(true);
        }
        transactionFlagRepository.saveAll(flags);

        Transaction savedTx = transactionRepository.save(transaction);
        return mapToResponse(savedTx);
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> getAccountHistory(Long accountId, int page, int size, String email) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        validateOwnership(account, email);

        Pageable pageable = PageRequest.of(page, size);
        return transactionRepository.findByAccountIdOrderByTimestampDesc(accountId, pageable)
                .map(this::mapToResponse);
    }

    private void validateOwnership(Account account, String email) {
        if (!account.getUser().getEmail().equals(email)) {
            throw new SecurityException("Unauthorized context access");
        }
    }

    private TransactionResponse mapToResponse(Transaction tx) {
        List<String> reasons = Collections.emptyList();
        if (tx.getFlags() != null && !tx.getFlags().isEmpty()) {
            reasons = tx.getFlags().stream()
                    .map(flag -> flag.getReason().name())
                    .collect(Collectors.toList());
        }

        return TransactionResponse.builder()
                .id(tx.getId())
                .type(tx.getType())
                .amount(tx.getAmount())
                .status(tx.getStatus())
                .notes(tx.getNotes())
                .sourceAccountNumber(tx.getAccount().getAccountNumber())
                .recipientAccountNumber(tx.getRelatedAccount() != null ? tx.getRelatedAccount().getAccountNumber() : null)
                .timestamp(tx.getTimestamp())
                .triggerReasons(reasons)
                .build();
    }
}