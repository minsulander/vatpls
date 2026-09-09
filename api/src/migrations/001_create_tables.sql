CREATE TYPE RATING AS ENUM
    ('OBS', 'S1', 'S2', 'S3', 'C1', 'C3', 'I3');

CREATE TABLE IF NOT EXISTS Controller(
    cid                 VARCHAR(7) PRIMARY KEY NOT NULL,
    controller_name     TEXT NOT NULL,
    sign                VARCHAR(2) DEFAULT 'XX',
    controller_rating   RATING DEFAULT 'OBS'
);

CREATE TABLE IF NOT EXISTS Session(
    session_id      SERIAL PRIMARY KEY, 
    cid             VARCHAR(7),
    position        TEXT NOT NULL,
    callsign        TEXT DEFAULT ' ',
    session_start   TIMESTAMP NOT NULL,
    session_end     TIMESTAMP,
    FOREIGN KEY(cid) REFERENCES Controller(cid)
);

CREATE TYPE STATE AS ENUM
    ('ACTIVE', 'PAUSE', 'OTHER');

CREATE TABLE IF NOT EXISTS Active(
    cid             VARCHAR(7) PRIMARY KEY REFERENCES Controller(cid),
    callsign        TEXT DEFAULT ' ',
    position        TEXT DEFAULT ' ',
    session_start   TIMESTAMP,
    in_list         STATE DEFAULT 'PAUSE'
);

CREATE TYPE ENDORSEMENT_TYPE AS ENUM(
    'NIL', 'T2 APS', 'T1 TWR', 'T1 APP', 'SOLO GG APP', 'SOLO GG TWR' 
);

CREATE TABLE IF NOT EXISTS Endorsements(
    cid             VARCHAR(7) NOT NULL,
    endorsement     ENDORSEMENT_TYPE NOT NULL,
    PRIMARY KEY(cid, endorsement),
    FOREIGN KEY(cid) REFERENCES Controller(cid)
);

CREATE TABLE IF NOT EXISTS SessionThresholds(
    threshold       TEXT PRIMARY KEY NOT NULL,
    threshold_time  INT NOT NULL
);
