package com.schedease.controller;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping("/ping")
    public Map<String, Object> ping() {
        return Map.of(
            "message", "Backend is running",
            "timestamp", System.currentTimeMillis(),
            "status", "ok"
        );
    }

    @GetMapping("/auth-status")
    public Map<String, Object> authStatus() {
        return Map.of(
            "message", "Auth status check",
            "timestamp", System.currentTimeMillis(),
            "requiresAuth", false
        );
    }
} 