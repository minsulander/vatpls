-- Trigger Function
CREATE OR REPLACE FUNCTION after_delete_insert_into_other_table()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO session (cid, position, session_start, session_end)
    VALUES (
        OLD.cid,
        COALESCE(OLD.position, OLD.in_list),
        OLD.session_start,
        NOW());
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER after_delete_trigger
AFTER DELETE ON active
FOR EACH ROW
EXECUTE FUNCTION after_delete_insert_into_other_table();