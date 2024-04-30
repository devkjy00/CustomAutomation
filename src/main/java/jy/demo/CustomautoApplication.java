package jy.demo;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;

@EnableFeignClients
@SpringBootApplication
public class CustomautoApplication {

	public static void main(String[] args) {
		SpringApplication.run(CustomautoApplication.class, args);
	}

	@Bean
	public CommandLineRunner run() {
		return args -> {
		};
	}
}