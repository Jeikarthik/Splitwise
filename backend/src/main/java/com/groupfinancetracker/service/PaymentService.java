package com.groupfinancetracker.service;

import com.groupfinancetracker.dto.DtoModels;
import com.groupfinancetracker.entity.PaymentState;
import com.groupfinancetracker.entity.PaymentStatus;
import com.groupfinancetracker.entity.Share;
import com.groupfinancetracker.exception.ForbiddenActionException;
import com.groupfinancetracker.exception.NotFoundException;
import com.groupfinancetracker.repository.PaymentStatusRepository;
import com.groupfinancetracker.repository.ShareRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {
    private final ShareRepository shareRepository;
    private final PaymentStatusRepository paymentStatusRepository;
    private final ShareService shareService;

    public DtoModels.ShareResponse markPaid(DtoModels.MarkPaymentRequest req) {
        Share s = shareRepository.findById(req.shareId())
                .orElseThrow(() -> new NotFoundException("Share not found: " + req.shareId()));
        if (!s.getUser().getId().equals(req.actorUserId())) {
            throw new ForbiddenActionException("Only debtor can mark paid");
        }
        PaymentStatus ps = paymentStatusRepository.findByShare_Id(s.getId())
                .orElseThrow(() -> new NotFoundException("Payment status not found for share: " + s.getId()));
        if (ps.getStatus() == PaymentState.CONFIRMED) {
            return shareService.toDto(s);
        }
        if (ps.getStatus() != PaymentState.UNPAID) {
            throw new IllegalStateException("Payment can only be marked from UNPAID");
        }
        ps.setStatus(PaymentState.MARKED_AS_PAID);
        ps.setMarkedAt(Instant.now());
        paymentStatusRepository.save(ps);
        return shareService.toDto(s);
    }

    public DtoModels.ShareResponse confirm(DtoModels.ConfirmPaymentRequest req) {
        Share s = shareRepository.findById(req.shareId())
                .orElseThrow(() -> new NotFoundException("Share not found: " + req.shareId()));
        Long payerId = s.getSubEvent().getPayer().getId();
        if (!payerId.equals(req.actorUserId())) {
            throw new ForbiddenActionException("Only payer can confirm payments");
        }
        PaymentStatus ps = paymentStatusRepository.findByShare_Id(s.getId())
                .orElseThrow(() -> new NotFoundException("Payment status not found for share: " + s.getId()));
        if (ps.getStatus() == PaymentState.CONFIRMED) {
            return shareService.toDto(s);
        }
        if (ps.getStatus() != PaymentState.MARKED_AS_PAID) {
            throw new IllegalStateException("Payment can only be confirmed after marked as paid");
        }
        ps.setStatus(PaymentState.CONFIRMED);
        ps.setConfirmedAt(Instant.now());
        paymentStatusRepository.save(ps);
        return shareService.toDto(s);
    }
}
