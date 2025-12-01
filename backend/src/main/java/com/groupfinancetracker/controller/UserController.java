package com.groupfinancetracker.controller;

import com.groupfinancetracker.dto.DtoModels.CreateUserRequest;
import com.groupfinancetracker.dto.DtoModels.UserResponse;
import com.groupfinancetracker.dto.DtoModels.JoinRequestResponse;
import com.groupfinancetracker.service.UserService;
import com.groupfinancetracker.service.GroupJoinService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final GroupJoinService groupJoinService;

    @PostMapping
    public UserResponse create(@Valid @RequestBody CreateUserRequest req) { return userService.create(req); }

    @GetMapping
    public List<UserResponse> list() { return userService.list(); }

    @GetMapping("/{id}")
    public UserResponse get(@PathVariable Long id) { return userService.get(id); }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { userService.delete(id); }

    @GetMapping("/{userId}/join-requests")
    public List<JoinRequestResponse> userJoinRequests(@PathVariable Long userId) {
        return groupJoinService.listPendingForUser(userId);
    }
}
