package com.groupfinancetracker.controller;

import com.groupfinancetracker.dto.DtoModels.AuthResponse;
import com.groupfinancetracker.dto.DtoModels.LoginRequest;
import com.groupfinancetracker.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) { return authService.login(req); }
}
