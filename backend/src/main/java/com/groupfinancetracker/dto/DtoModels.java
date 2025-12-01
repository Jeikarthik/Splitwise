package com.groupfinancetracker.dto;

import com.groupfinancetracker.entity.PaymentState;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public final class DtoModels {
    private DtoModels() {}

    public record CreateUserRequest(@NotBlank String name, @NotBlank @Email String email, @NotBlank @Size(min = 8) String password) {}
    public record UserResponse(Long id, String name, String email, Instant createdAt) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
    public record AuthResponse(@NotBlank String token, UserResponse user) {}

    public record CreateGroupRequest(@NotBlank String name, @NotNull Long creatorId, Set<Long> memberIds) {}
    public record UpdateGroupRequest(@NotBlank String name) {}
    public record GroupResponse(Long id, String name, Long creatorId, Set<Long> memberIds, Instant createdAt, String groupCode) {}
    public record AddMemberRequest(@NotNull Long userId) {}
    public record GenerateGroupCodeResponse(Long groupId, String groupCode) {}
    public record GroupCodeResponse(Long groupId, String groupCode) {}

    public record CreateEventRequest(@NotNull Long groupId, @NotBlank String name, @NotNull Long creatorId, LocalDate eventDate) {}
    public record EventResponse(Long id, String name, Long groupId, Long creatorId, Instant createdAt, LocalDate eventDate, Integer weekNumber, Integer year) {}

    public record CreateSubEventRequest(
            @NotNull Long eventId,
            @NotBlank String description,
            @NotNull @Positive BigDecimal totalAmount,
            @NotNull Long payerId,
            @NotNull LocalDate subEventDate,
            @NotEmpty List<ShareSplit> shares
    ) {}

    public record ShareSplit(@NotNull Long userId, @NotNull @Positive BigDecimal amount) {}

    public record SubEventResponse(Long id, String description, BigDecimal totalAmount, Long payerId, Long eventId, Long eventCreatorId, Instant timestamp, LocalDate subEventDate, Integer weekNumber, Integer year) {}

    public record ShareResponse(Long id, Long subEventId, Long userId, Long payerId, BigDecimal amount,
                                PaymentState status, Instant markedAt, Instant confirmedAt) {}

    public record MarkPaymentRequest(@NotNull Long shareId, @NotNull Long actorUserId) {}
    public record ConfirmPaymentRequest(@NotNull Long shareId, @NotNull Long actorUserId) {}

    public record UserBalance(Long userId, BigDecimal netBalance) {}
    public record GroupSettlementSummary(Long groupId, List<UserBalance> balances, int outstandingConfirmations) {}
    public record UserOutstandingDebts(Long userId, List<ShareResponse> debts) {}

    public record PairwiseOwe(Long fromUserId, Long toUserId, BigDecimal amount) {}
    public record GroupPairwise(Long groupId, List<PairwiseOwe> owes) {}

    public record SubmitJoinRequest(@NotBlank String groupCode, @NotNull Long userId) {}
    public record JoinRequestResponse(Long id, String groupCode, Long requesterId, String status, LocalDateTime requestedAt, LocalDateTime respondedAt, Long respondedBy) {}

    public record WeekSummary(Integer weekNumber, Integer year, Long eventCount) {}

    public record ToPayEntry(Long userId, String toUser, BigDecimal amount) {}
    public record ToReceiveEntry(Long userId, String fromUser, BigDecimal amount) {}
    public record PairwiseBalance(Long user1Id, String user1, Long user2Id, String user2, BigDecimal amount, String owedBy) {}
    public record WeeklySettlementResponse(Integer weekNumber, Integer year, Long currentUser, List<ToPayEntry> toPay, List<ToReceiveEntry> toReceive, List<PairwiseBalance> pairwiseBalances) {}

    public record EventSettlementResponse(Long eventId, List<PairwiseBalance> pairwiseBalances) {}

    public record NewEventWarningResponse(boolean warn, Integer droppingWeek, Integer droppingYear, int pendingPayments, String message) {}

    public record SpendResponse(BigDecimal amount) {}

    public record CreateInvitationRequest(@NotNull Long groupId, @NotNull Long invitedUserId) {}
    public record InvitationResponse(Long id, Long groupId, String groupName, Long invitedUserId, String invitedUserName, Long invitedById, String invitedByName, String status, LocalDateTime createdAt) {}
    public record RespondInvitationRequest(@NotNull String status) {} // status: ACCEPTED, REJECTED
}
