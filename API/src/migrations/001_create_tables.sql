CREATE TYPE RATING AS ENUM
    ('OBS', 'S1', 'S2', 'S3', 'C1', 'C3', 'I3');

CREATE TABLE IF NOT EXISTS Controller(
    cid                 VARCHAR(7) PRIMARY KEY NOT NULL,
    controller_name     TEXT NOT NULL,
    sign                VARCHAR(2) DEFAULT 'XX',
    controller_rating   RATING DEFAULT 'OBS'
);

CREATE TABLE IF NOT EXISTS Session(
    cid             VARCHAR(7) PRIMARY KEY REFERENCES Controller(cid),
    position        TEXT NOT NULL,
    session_start   TIMESTAMP NOT NULL,
    session_end     TIMESTAMP
);

CREATE TYPE STATE AS ENUM
    ('ACTIVE', 'PAUSE', 'OTHER');

CREATE TABLE IF NOT EXISTS Active(
    cid             VARCHAR(7) PRIMARY KEY REFERENCES Controller(cid),
    position        TEXT NOT NULL,
    session_start   TIMESTAMP,
    in_list         STATE DEFAULT 'PAUSE'
);