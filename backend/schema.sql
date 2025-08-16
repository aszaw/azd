-- Enable fuzzy string matching (pg_trgm extension)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Table to store uploaded files
CREATE TABLE IF NOT EXISTS files (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    class TEXT,
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: index to speed up fuzzy search
CREATE INDEX IF NOT EXISTS idx_files_filename_trgm ON files USING gin (filename gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_files_class_trgm ON files USING gin (class gin_trgm_ops);
