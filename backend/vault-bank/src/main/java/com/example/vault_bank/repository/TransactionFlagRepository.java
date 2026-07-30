package com.example.vault_bank.repository;

import com.example.vault_bank.entity.TransactionFlag;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TransactionFlagRepository extends JpaRepository<TransactionFlag, Long> {
    List<TransactionFlag> findByTransactionId(Long transactionId);
}