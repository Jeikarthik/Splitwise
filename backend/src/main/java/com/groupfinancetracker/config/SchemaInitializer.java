package com.groupfinancetracker.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SchemaInitializer {
    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void init() {
        try {
            jdbcTemplate.execute("ALTER TABLE IF EXISTS sub_events ADD COLUMN IF NOT EXISTS sub_event_date date");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS sub_events ADD COLUMN IF NOT EXISTS week_number integer");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS sub_events ADD COLUMN IF NOT EXISTS year integer");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_subevent_week_year ON sub_events(week_number, year)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS event_date date");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS week_number integer");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS year integer");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_event_week_year ON events(week_number, year)");
        } catch (Exception ignored) {
        }
    }
}
