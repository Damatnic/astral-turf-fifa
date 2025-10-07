-- Mark Phase 2 migrations as complete
-- Run this to skip Phase 2 migrations that have already been applied manually

INSERT INTO migrations (timestamp, name)
VALUES 
  (1728332400000, 'InitialSchema1728332400000')
ON CONFLICT DO NOTHING;

-- Verify
SELECT * FROM migrations ORDER BY timestamp;
