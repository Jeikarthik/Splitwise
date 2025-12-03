package com.groupfinancetracker.service;

import com.groupfinancetracker.dto.DtoModels;
import com.groupfinancetracker.entity.*;
import com.groupfinancetracker.exception.NotFoundException;
import com.groupfinancetracker.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SubEventService {
    private final SubEventRepository subEventRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final ShareRepository shareRepository;
    private final PaymentStatusRepository paymentStatusRepository;

    public DtoModels.SubEventResponse create(DtoModels.CreateSubEventRequest req) {
        Event event = eventRepository.findById(req.eventId())
                .orElseThrow(() -> new NotFoundException("Event not found: " + req.eventId()));
        User payer = userRepository.findById(req.payerId())
                .orElseThrow(() -> new NotFoundException("Payer not found: " + req.payerId()));

        // Validate date
        if (req.subEventDate().isBefore(event.getStartDate()) || req.subEventDate().isAfter(event.getEndDate())) {
            throw new IllegalArgumentException("Expense date must be within event dates (" + event.getStartDate()
                    + " to " + event.getEndDate() + ")");
        }

        // Compute custom week numbering starting at 1 from the first subevent date in
        // the app
        LocalDate base = subEventRepository.findEarliestSubEventDate();
        if (base == null)
            base = req.subEventDate();
        int weekIndex = (int) ChronoUnit.WEEKS.between(base, req.subEventDate()) + 1; // week-1 based

        SubEvent se = SubEvent.builder()
                .description(req.description())
                .totalAmount(req.totalAmount())
                .payer(payer)
                .event(event)
                .timestamp(Instant.now())
                .subEventDate(req.subEventDate())
                .weekNumber(weekIndex)
                .year(1) // single sequence; we don't use calendar years for custom weeks
                .build();
        se = subEventRepository.save(se);

        BigDecimal sum = BigDecimal.ZERO;
        for (DtoModels.ShareSplit split : req.shares()) {
            User u = userRepository.findById(split.userId())
                    .orElseThrow(() -> new NotFoundException("User not found: " + split.userId()));
            Share s = Share.builder()
                    .subEvent(se)
                    .user(u)
                    .amount(split.amount())
                    .build();
            s = shareRepository.save(s);
            PaymentStatus ps;
            if (u.getId().equals(payer.getId())) {
                ps = PaymentStatus.builder()
                        .share(s)
                        .status(PaymentState.CONFIRMED)
                        .markedAt(Instant.now())
                        .confirmedAt(Instant.now())
                        .build();
            } else {
                ps = PaymentStatus.builder()
                        .share(s)
                        .status(PaymentState.UNPAID)
                        .build();
            }
            paymentStatusRepository.save(ps);
            s.setPaymentStatus(ps);
            sum = sum.add(split.amount());
        }

        BigDecimal diff = sum.subtract(req.totalAmount()).abs();
        if (diff.compareTo(new BigDecimal("0.01")) > 0) {
            throw new IllegalStateException("Share splits must sum to total amount");
        }

        // No longer deleting old weeks; we will hide older pages in UI while preserving
        // history

        return toDto(se);
    }

    public List<DtoModels.SubEventResponse> listByEvent(Long eventId) {
        return subEventRepository.findByEvent_Id(eventId).stream().map(this::toDto).toList();
    }

    public DtoModels.SubEventResponse get(Long id) {
        SubEvent se = subEventRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("SubEvent not found: " + id));
        return toDto(se);
    }

    private DtoModels.SubEventResponse toDto(SubEvent se) {
        return new DtoModels.SubEventResponse(se.getId(), se.getDescription(), se.getTotalAmount(),
                se.getPayer().getId(), se.getEvent().getId(), se.getEvent().getCreator().getId(), se.getTimestamp(),
                se.getSubEventDate(), se.getWeekNumber(), se.getYear());
    }
}
