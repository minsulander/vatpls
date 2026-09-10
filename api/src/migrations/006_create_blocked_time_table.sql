CREATE TABLE IF NOT EXISTS BlockedTime(
    block_id        SERIAL PRIMARY KEY,
    cid             VARCHAR(7) NOT NULL,
    position        TEXT NOT NULL,
    blocked_start   TIMESTAMP NOT NULL,
    blocked_end     TIMESTAMP NOT NULL,
    reason          TEXT NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY(cid) REFERENCES Controller(cid)
);

CREATE INDEX IF NOT EXISTS idx_blocked_time_dates ON BlockedTime(blocked_start, blocked_end);

CREATE INDEX IF NOT EXISTS idx_blocked_time_position ON BlockedTime(position);
