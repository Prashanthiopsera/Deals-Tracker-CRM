-- Minimal seed for docker-compose integration tests (WO-011).
CREATE TABLE IF NOT EXISTS health_probe (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO health_probe DEFAULT VALUES;
