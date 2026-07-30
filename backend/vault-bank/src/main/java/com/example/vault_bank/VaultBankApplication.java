package com.example.vault_bank;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class VaultBankApplication {

	public static void main(String[] args) {
		SpringApplication.run(VaultBankApplication.class, args);
	}

}
