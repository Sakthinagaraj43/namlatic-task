-- Reference PostgreSQL schema for Vespera Stays Hotel Directory
CREATE TABLE IF NOT EXISTS hotels (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(100) NOT NULL CHECK (char_length(trim(title)) >= 3),
  description TEXT NOT NULL CHECK (char_length(trim(description)) >= 10),
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotels_title ON hotels (LOWER(title));
CREATE INDEX IF NOT EXISTS idx_hotels_price ON hotels (price);
