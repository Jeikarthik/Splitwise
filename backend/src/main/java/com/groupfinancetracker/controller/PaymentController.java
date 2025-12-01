package com.groupfinancetracker.controller;

import com.groupfinancetracker.dto.DtoModels.ConfirmPaymentRequest;
import com.groupfinancetracker.dto.DtoModels.MarkPaymentRequest;
import com.groupfinancetracker.dto.DtoModels.ShareResponse;
import com.groupfinancetracker.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;

    @PostMapping("/mark-paid")
    public ShareResponse markPaid(@RequestBody Map<String, Long> body) {
        Object details = SecurityContextHolder.getContext().getAuthentication() != null ? SecurityContextHolder.getContext().getAuthentication().getDetails() : null;
        Long actorId = details instanceof Long ? (Long) details : null;
        Long shareId = body.get("shareId");
        return paymentService.markPaid(new MarkPaymentRequest(shareId, actorId));
    }

    @PostMapping("/confirm")
    public ShareResponse confirm(@RequestBody Map<String, Long> body) {
        Object details = SecurityContextHolder.getContext().getAuthentication() != null ? SecurityContextHolder.getContext().getAuthentication().getDetails() : null;
        Long actorId = details instanceof Long ? (Long) details : null;
        Long shareId = body.get("shareId");
        return paymentService.confirm(new ConfirmPaymentRequest(shareId, actorId));
    }
}
