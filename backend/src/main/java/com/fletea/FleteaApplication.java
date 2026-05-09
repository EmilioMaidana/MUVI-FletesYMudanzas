package com.fletea;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class FleteaApplication {
    public static void main(String[] args) {
        SpringApplication.run(FleteaApplication.class, args);
    }
}
