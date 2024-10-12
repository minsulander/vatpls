CREATE OR REPLACE FUNCTION give_c1_all_endorsements()
RETURNS TRIGGER AS $$ 
BEGIN
    INSERT INTO Endorsements(cid, endorsement)
    VALUES
    (NEW.cid, 'T1 APP'),
    (NEW.cid, 'T2 APS'),
    (NEW.cid, 'T1 TWR');
    RETURN NULL;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER give_c1_endorsement
AFTER INSERT ON Controller
FOR EACH ROW
WHEN (NEW.controller_rating = 'C1')
EXECUTE FUNCTION give_c1_all_endorsements();