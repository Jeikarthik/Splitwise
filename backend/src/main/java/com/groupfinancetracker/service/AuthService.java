package com.groupfinancetracker.service;

import com.groupfinancetracker.dto.DtoModels;
import com.groupfinancetracker.entity.User;
import com.groupfinancetracker.exception.NotFoundException;
import com.groupfinancetracker.repository.UserRepository;
import com.groupfinancetracker.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public DtoModels.AuthResponse login(DtoModels.LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new NotFoundException("Invalid credentials"));
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new NotFoundException("Invalid credentials");
        }
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        var userDto = new DtoModels.UserResponse(user.getId(), user.getName(), user.getEmail(), user.getCreatedAt());
        return new DtoModels.AuthResponse(token, userDto);
    }
}
