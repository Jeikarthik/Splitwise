package com.groupfinancetracker.service;

import com.groupfinancetracker.dto.DtoModels;
import com.groupfinancetracker.entity.Group;
import com.groupfinancetracker.entity.PaymentState;
import com.groupfinancetracker.entity.Share;
import com.groupfinancetracker.exception.NotFoundException;
import com.groupfinancetracker.repository.GroupRepository;
import com.groupfinancetracker.repository.ShareRepository;
import jakarta.transaction.Transactional;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class SettlementService {
    private final ShareRepository shareRepository;
    private final GroupRepository groupRepository;
    private final ShareService shareService;
    private final UserService userService;
    private final com.groupfinancetracker.repository.SubEventRepository subEventRepository;

    public DtoModels.GroupSettlementSummary groupSummary(@NonNull Long groupId) {
        Group g = groupRepository.findById(groupId)
                .orElseThrow(() -> new NotFoundException("Group not found: " + groupId));
        List<Share> shares = shareRepository.findBySubEvent_Event_Group_Id(groupId);
        Map<Long, BigDecimal> balances = new HashMap<>();
        int outstanding = 0;
        for (Share s : shares) {
            Long payerId = s.getSubEvent().getPayer().getId();
            Long debtorId = s.getUser().getId();
            BigDecimal amt = s.getAmount();
            balances.merge(payerId, amt, BigDecimal::add);
            balances.merge(debtorId, amt.negate(), BigDecimal::add);
            if (s.getPaymentStatus() != null && s.getPaymentStatus().getStatus() == PaymentState.MARKED_AS_PAID) {
                outstanding++;
            }
        }
        List<DtoModels.UserBalance> list = balances.entrySet().stream()
                .map(e -> new DtoModels.UserBalance(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(DtoModels.UserBalance::userId))
                .toList();
        return new DtoModels.GroupSettlementSummary(g.getId(), list, outstanding);
    }

    public DtoModels.UserOutstandingDebts userDebts(@NonNull Long userId) {
        var shares = shareRepository.findByUser_IdAndPaymentStatus_StatusNot(userId, PaymentState.CONFIRMED);
        var debts = shares.stream().map(shareService::toDto).toList();
        return new DtoModels.UserOutstandingDebts(userId, debts);
    }

    public DtoModels.GroupPairwise groupPairwise(@NonNull Long groupId) {
        if (!groupRepository.existsById(groupId)) throw new NotFoundException("Group not found: " + groupId);
        List<Share> shares = shareRepository.findBySubEvent_Event_Group_Id(groupId);
        Map<String, BigDecimal> raw = new HashMap<>();
        for (Share s : shares) {
            Long from = s.getUser().getId(); // debtor
            Long to = s.getSubEvent().getPayer().getId(); // payer
            if (Objects.equals(from, to)) continue;
            // Exclude confirmed payments so only outstanding amounts are considered
            if (s.getPaymentStatus() != null && s.getPaymentStatus().getStatus() == PaymentState.CONFIRMED) {
                continue;
            }
            String key = from + "->" + to;
            raw.merge(key, s.getAmount(), BigDecimal::add);
        }
        // Net pairs: keep only the positive difference in one direction
        Map<String, BigDecimal> net = new HashMap<>();
        for (String key : raw.keySet()) {
            String[] parts = key.split("->");
            String rev = parts[1] + "->" + parts[0];
            BigDecimal a = raw.getOrDefault(key, BigDecimal.ZERO);
            BigDecimal b = raw.getOrDefault(rev, BigDecimal.ZERO);
            if (a.compareTo(b) > 0) {
                net.put(key, a.subtract(b));
            }
        }
        List<DtoModels.PairwiseOwe> list = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> e : net.entrySet()) {
            if (e.getValue() == null || e.getValue().compareTo(BigDecimal.ZERO) <= 0) continue;
            String[] parts = e.getKey().split("->");
            Long from = Long.parseLong(parts[0]);
            Long to = Long.parseLong(parts[1]);
            list.add(new DtoModels.PairwiseOwe(from, to, e.getValue()));
        }
        list.sort(Comparator.comparing(DtoModels.PairwiseOwe::fromUserId).thenComparing(DtoModels.PairwiseOwe::toUserId));
        return new DtoModels.GroupPairwise(groupId, list);
    }

    public DtoModels.WeeklySettlementResponse weeklySettlements(@NonNull Long groupId, @NonNull Integer weekNumber, @NonNull Integer year, Long currentUserId) {
        if (!groupRepository.existsById(groupId)) throw new NotFoundException("Group not found: " + groupId);
        List<Share> shares = shareRepository.findBySubEvent_Event_Group_IdAndSubEvent_WeekNumberAndSubEvent_Year(groupId, weekNumber, year);

        // Build pair totals excluding confirmed (i.e., outstanding only)
        Map<Long, String> userNames = new HashMap<>();
        Map<String, BigDecimal> raw = new HashMap<>(); // from->to outstanding
        for (Share s : shares) {
            Long from = s.getUser().getId();
            Long to = s.getSubEvent().getPayer().getId();
            if (Objects.equals(from, to)) continue;
            userNames.putIfAbsent(from, null);
            userNames.putIfAbsent(to, null);
            if (s.getPaymentStatus() != null && s.getPaymentStatus().getStatus() == PaymentState.CONFIRMED) {
                continue; // deduct confirmed amounts (skip)
            }
            raw.merge(from + "->" + to, s.getAmount(), BigDecimal::add);
        }

        // Net pairs
        Map<String, BigDecimal> net = new HashMap<>();
        for (String key : raw.keySet()) {
            String[] parts = key.split("->");
            String rev = parts[1] + "->" + parts[0];
            BigDecimal a = raw.getOrDefault(key, BigDecimal.ZERO);
            BigDecimal b = raw.getOrDefault(rev, BigDecimal.ZERO);
            int cmp = a.compareTo(b);
            if (cmp > 0) {
                net.put(key, a.subtract(b));
            } else if (cmp < 0) {
                // will be handled when iterating rev
            } else {
                // equal -> settled
            }
        }

        // Resolve user names via UserService
        userNames.replaceAll((id, v) -> {
            try { return userService.get(id).name(); } catch (Exception e) { return String.valueOf(id); }
        });

        // Build pairwise balances and toPay/toReceive for current user
        List<DtoModels.PairwiseBalance> pairwise = new ArrayList<>();
        List<DtoModels.ToPayEntry> toPay = new ArrayList<>();
        List<DtoModels.ToReceiveEntry> toReceive = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> e : net.entrySet()) {
            if (e.getValue() == null || e.getValue().compareTo(BigDecimal.ZERO) <= 0) continue;
            String[] parts = e.getKey().split("->");
            Long from = Long.parseLong(parts[0]);
            Long to = Long.parseLong(parts[1]);
            BigDecimal amount = e.getValue();
            pairwise.add(new DtoModels.PairwiseBalance(
                    from, userNames.getOrDefault(from, String.valueOf(from)),
                    to, userNames.getOrDefault(to, String.valueOf(to)),
                    amount,
                    userNames.getOrDefault(from, String.valueOf(from))
            ));
            if (currentUserId != null) {
                if (Objects.equals(currentUserId, from)) {
                    toPay.add(new DtoModels.ToPayEntry(to, userNames.getOrDefault(to, String.valueOf(to)), amount));
                } else if (Objects.equals(currentUserId, to)) {
                    toReceive.add(new DtoModels.ToReceiveEntry(from, userNames.getOrDefault(from, String.valueOf(from)), amount));
                }
            }
        }

        // Sort outputs
        pairwise.sort(Comparator.comparing(DtoModels.PairwiseBalance::user1Id).thenComparing(DtoModels.PairwiseBalance::user2Id));
        toPay.sort(Comparator.comparing(DtoModels.ToPayEntry::toUser));
        toReceive.sort(Comparator.comparing(DtoModels.ToReceiveEntry::fromUser));

        return new DtoModels.WeeklySettlementResponse(weekNumber, year, currentUserId, toPay, toReceive, pairwise);
    }

    public DtoModels.EventSettlementResponse eventPairwise(@NonNull Long eventId) {
        List<Share> shares = shareRepository.findBySubEvent_Event_Id(eventId);
        Map<Long, String> userNames = new HashMap<>();
        Map<String, BigDecimal> raw = new HashMap<>();
        for (Share s : shares) {
            Long from = s.getUser().getId();
            Long to = s.getSubEvent().getPayer().getId();
            if (Objects.equals(from, to)) continue;
            if (s.getPaymentStatus() != null && s.getPaymentStatus().getStatus() == PaymentState.CONFIRMED) {
                continue;
            }
            userNames.putIfAbsent(from, null);
            userNames.putIfAbsent(to, null);
            raw.merge(from + "->" + to, s.getAmount(), BigDecimal::add);
        }
        Map<String, BigDecimal> net = new HashMap<>();
        for (String key : raw.keySet()) {
            String[] parts = key.split("->");
            String rev = parts[1] + "->" + parts[0];
            BigDecimal a = raw.getOrDefault(key, BigDecimal.ZERO);
            BigDecimal b = raw.getOrDefault(rev, BigDecimal.ZERO);
            int cmp = a.compareTo(b);
            if (cmp > 0) net.put(key, a.subtract(b));
        }
        userNames.replaceAll((id, v) -> {
            try { return userService.get(id).name(); } catch (Exception e) { return String.valueOf(id); }
        });
        List<DtoModels.PairwiseBalance> pairwise = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> e : net.entrySet()) {
            if (e.getValue() == null || e.getValue().compareTo(BigDecimal.ZERO) <= 0) continue;
            String[] parts = e.getKey().split("->");
            Long from = Long.parseLong(parts[0]);
            Long to = Long.parseLong(parts[1]);
            BigDecimal amount = e.getValue();
            pairwise.add(new DtoModels.PairwiseBalance(
                    from, userNames.getOrDefault(from, String.valueOf(from)),
                    to, userNames.getOrDefault(to, String.valueOf(to)),
                    amount,
                    userNames.getOrDefault(from, String.valueOf(from))
            ));
        }
        pairwise.sort(Comparator.comparing(DtoModels.PairwiseBalance::user1Id).thenComparing(DtoModels.PairwiseBalance::user2Id));
        return new DtoModels.EventSettlementResponse(eventId, pairwise);
    }

    public DtoModels.SpendResponse mySpendForEvent(@NonNull Long eventId, @NonNull Long actorUserId) {
        java.math.BigDecimal sum = subEventRepository.sumTotalByEventAndPayer(eventId, actorUserId);
        return new DtoModels.SpendResponse(sum);
    }

    public DtoModels.SpendResponse mySpendForGroup(@NonNull Long groupId, @NonNull Long actorUserId) {
        java.math.BigDecimal sum = subEventRepository.sumTotalByGroupAndPayer(groupId, actorUserId);
        return new DtoModels.SpendResponse(sum);
    }
}
