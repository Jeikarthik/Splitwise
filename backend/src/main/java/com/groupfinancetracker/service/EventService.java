package com.groupfinancetracker.service;

import com.groupfinancetracker.dto.DtoModels;
import com.groupfinancetracker.entity.Event;
import com.groupfinancetracker.entity.Group;
import com.groupfinancetracker.entity.User;
import com.groupfinancetracker.exception.NotFoundException;
import com.groupfinancetracker.repository.EventRepository;
import com.groupfinancetracker.repository.SubEventRepository;
import com.groupfinancetracker.repository.ShareRepository;
import com.groupfinancetracker.repository.GroupRepository;
import com.groupfinancetracker.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class EventService {
    private final EventRepository eventRepository;
    private final SubEventRepository subEventRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final ShareRepository shareRepository;

    public DtoModels.EventResponse create(DtoModels.CreateEventRequest req) {
        Group group = groupRepository.findById(req.groupId())
                .orElseThrow(() -> new NotFoundException("Group not found: " + req.groupId()));
        User creator = userRepository.findById(req.creatorId())
                .orElseThrow(() -> new NotFoundException("Creator not found: " + req.creatorId()));
        LocalDate date = req.eventDate();
        if (date == null)
            date = LocalDate.now();
        Event e = Event.builder().name(req.name()).group(group).creator(creator).eventDate(date).build();
        // Assign custom week/year aligned with SubEventService so events appear in
        // weekly view immediately
        if (e.getEventDate() != null) {
            LocalDate base = subEventRepository.findEarliestSubEventDate();
            if (base == null)
                base = e.getEventDate();
            int weekIndex = (int) ChronoUnit.WEEKS.between(base, e.getEventDate()) + 1;
            e.setWeekNumber(weekIndex);
            e.setYear(1);
        }
        e = eventRepository.save(e);
        return toDto(e);
    }

    public List<DtoModels.EventResponse> listByGroup(@NonNull Long groupId) {
        if (!groupRepository.existsById(groupId))
            throw new NotFoundException("Group not found: " + groupId);
        return eventRepository.findByGroup_Id(groupId).stream().map(e -> this.toDto(e)).toList();
    }

    public List<DtoModels.EventResponse> listByGroupWeek(@NonNull Long groupId, @NonNull Integer weekNumber,
            @NonNull Integer year) {
        if (!groupRepository.existsById(groupId))
            throw new NotFoundException("Group not found: " + groupId);
        Set<Long> eventIds = new HashSet<>();
        var fromSubs = subEventRepository.findEventIdsByGroupAndWeek(groupId, weekNumber, year);
        if (fromSubs != null)
            eventIds.addAll(fromSubs);
        var fromEvents = eventRepository.findByGroup_IdAndWeekNumberAndYear(groupId, weekNumber, year);
        if (fromEvents != null)
            fromEvents.forEach(ev -> eventIds.add(ev.getId()));
        return eventRepository.findAllById(eventIds).stream()
                .sorted(Comparator.comparing(Event::getEventDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toDto)
                .toList();
    }

    public List<DtoModels.WeekSummary> listWeeks(@NonNull Long groupId) {
        if (!groupRepository.existsById(groupId))
            throw new NotFoundException("Group not found: " + groupId);
        Map<String, java.util.Set<Long>> weekEvents = new HashMap<>(); // key: week-year -> unique event IDs
        // from subevents: iterate distinct weeks and collect event IDs per week
        for (Object[] arr : subEventRepository.listDistinctWeeksAscByGroup(groupId)) {
            Integer y = ((Number) arr[0]).intValue();
            Integer w = ((Number) arr[1]).intValue();
            String key = w + "-" + y;
            weekEvents.putIfAbsent(key, new java.util.HashSet<>());
            var ids = subEventRepository.findEventIdsByGroupAndWeek(groupId, w, y);
            if (ids != null)
                weekEvents.get(key).addAll(ids);
        }
        // from events: add their IDs into the same map
        for (Event e : eventRepository.findByGroup_Id(groupId)) {
            if (e.getWeekNumber() == null || e.getYear() == null)
                continue;
            String key = e.getWeekNumber() + "-" + e.getYear();
            weekEvents.putIfAbsent(key, new java.util.HashSet<>());
            weekEvents.get(key).add(e.getId());
        }
        List<DtoModels.WeekSummary> out = new ArrayList<>();
        for (Map.Entry<String, java.util.Set<Long>> e : weekEvents.entrySet()) {
            String[] parts = e.getKey().split("-");
            out.add(new DtoModels.WeekSummary(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]),
                    (long) e.getValue().size()));
        }
        out.sort(Comparator.comparing(DtoModels.WeekSummary::year).reversed()
                .thenComparing(DtoModels.WeekSummary::weekNumber, Comparator.reverseOrder()));
        // Limit to the most recent 10 weeks
        if (out.size() > 10) {
            return new ArrayList<>(out.subList(0, 10));
        }
        return out;
    }

    public DtoModels.EventResponse get(Long id) {
        Event e = eventRepository.findById(id).orElseThrow(() -> new NotFoundException("Event not found: " + id));
        return toDto(e);
    }

    private DtoModels.EventResponse toDto(Event e) {
        return new DtoModels.EventResponse(
                e.getId(),
                e.getName(),
                e.getGroup().getId(),
                e.getCreator().getId(),
                e.getCreatedAt(),
                e.getEventDate(),
                e.getWeekNumber(),
                e.getYear());
    }

    public DtoModels.NewEventWarningResponse newEventWarning(@NonNull Long groupId, java.time.LocalDate date) {
        if (!groupRepository.existsById(groupId))
            throw new NotFoundException("Group not found: " + groupId);
        java.time.LocalDate eventDate = (date != null) ? date : java.time.LocalDate.now();
        // Compute custom week index aligned with SubEventService
        java.time.LocalDate base = subEventRepository.findEarliestSubEventDate();
        if (base == null)
            base = eventDate;
        int weekIndex = (int) java.time.temporal.ChronoUnit.WEEKS.between(base, eventDate) + 1;

        // Build distinct weeks as numeric pairs
        java.util.List<int[]> weeks = new java.util.ArrayList<>();
        for (Object[] arr : subEventRepository.listDistinctWeeksAscByGroup(groupId)) {
            Integer y = ((Number) arr[0]).intValue();
            Integer w = ((Number) arr[1]).intValue();
            weeks.add(new int[] { y, w });
        }
        for (Event e : eventRepository.findByGroup_Id(groupId)) {
            if (e.getWeekNumber() != null && e.getYear() != null) {
                weeks.add(new int[] { e.getYear(), e.getWeekNumber() });
            }
        }
        // de-duplicate
        java.util.Set<String> weekKeys = new java.util.HashSet<>();
        java.util.List<int[]> deduped = new java.util.ArrayList<>();
        for (int[] yw : weeks) {
            String key = yw[0] + ":" + yw[1];
            if (weekKeys.add(key))
                deduped.add(yw);
        }
        // check presence
        boolean alreadyPresent = weekKeys.contains(1 + ":" + weekIndex); // year is always 1 in custom scheme
        int newSize = deduped.size() + (alreadyPresent ? 0 : 1);
        if (newSize <= 10) {
            return new DtoModels.NewEventWarningResponse(false, null, null, 0, null);
        }
        // Identify the week that would be dropped: the earliest (min year, then min
        // week)
        int[] earliest = null;
        for (int[] yw : deduped) {
            if (earliest == null || yw[0] < earliest[0] || (yw[0] == earliest[0] && yw[1] < earliest[1])) {
                earliest = yw;
            }
        }
        if (earliest == null) {
            return new DtoModels.NewEventWarningResponse(false, null, null, 0, null);
        }
        Integer dropYear = earliest[0];
        Integer dropWeek = earliest[1];

        // Count pending (non-CONFIRMED) payments in the dropping week
        var shares = shareRepository.findBySubEvent_Event_Group_IdAndSubEvent_WeekNumberAndSubEvent_Year(groupId,
                dropWeek, dropYear);
        int pending = 0;
        for (var s : shares) {
            if (s.getPaymentStatus() == null
                    || s.getPaymentStatus().getStatus() != com.groupfinancetracker.entity.PaymentState.CONFIRMED) {
                pending++;
            }
        }
        if (pending > 0) {
            String msg = "Adding this event creates a new page and hides the oldest page. There are " + pending
                    + " pending payments there.";
            return new DtoModels.NewEventWarningResponse(true, dropWeek, dropYear, pending, msg);
        }
        return new DtoModels.NewEventWarningResponse(false, dropWeek, dropYear, 0, null);
    }

    public void delete(Long eventId, Long actorUserId) {
        Event e = eventRepository.findById(eventId)
                .orElseThrow(() -> new NotFoundException("Event not found: " + eventId));
        if (!e.getCreator().getId().equals(actorUserId)) {
            throw new com.groupfinancetracker.exception.ForbiddenActionException(
                    "Only the event creator can delete the event");
        }
        // Check if event has any sub-events (expenses)
        if (!e.getSubEvents().isEmpty()) {
            throw new IllegalStateException(
                    "Cannot delete event with existing expenses. Please delete all expenses first.");
        }
        eventRepository.delete(e);
    }
}
