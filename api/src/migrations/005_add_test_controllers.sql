-- insert test controllers..
INSERT INTO controller (cid, controller_name, sign, controller_rating) VALUES
('1234567', 'Controller One', 'CO', 'S3'),
('2345678', 'Controller Two', 'CT', 'S2'),
('3456789', 'Controller Fthree', 'CF', 'C1')
ON CONFLICT (cid) DO NOTHING;

