package com.example.vault_bank.repository;

import com.example.vault_bank.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.example.vault_bank.entity.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // Paginated transaction history for a specific account
    Page<Transaction> findByAccountIdOrderByTimestampDesc(Long accountId, Pageable pageable);

    // Used by risk engine to check count of transactions in a time window
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.account.id = :accountId AND t.timestamp >= :timeWindow")
    long countRecentTransactions(@Param("accountId") Long accountId, @Param("timeWindow") LocalDateTime timeWindow);

    // Used by risk engine to see if user has sent funds to this recipient account before
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.account.id = :accountId AND t.relatedAccount.id = :relatedAccountId AND t.status = 'COMPLETED'")
    long countCompletedTransfersToRecipient(@Param("accountId") Long accountId, @Param("relatedAccountId") Long relatedAccountId);

    boolean existsByAccountIdAndTypeAndTimestampAfter(Long accountId, TransactionType type, LocalDateTime timestamp);

}