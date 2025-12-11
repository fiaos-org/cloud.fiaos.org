-- ==========================================
-- FIAPHY ENVIRONMENTAL MONITORING SYSTEM
-- Supabase Database Schema
-- ==========================================
-- 
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard: https://uopikbgoyrmtknbomvgo.supabase.co
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New Query"
-- 4. Copy and paste this entire file
-- 5. Click "Run" to execute
--
-- This will create:
-- - sensor_data table (stores all sensor readings)
-- - Indexes for fast queries (timestamp, GPS, IP)
-- - Row Level Security (RLS) policies for public read/write
-- ==========================================

-- Drop existing table if it exists (to fix any schema issues)
DROP TABLE IF EXISTS sensor_data CASCADE;

-- Create the main sensor data table
CREATE TABLE sensor_data (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Sensor readings
    temperature NUMERIC(5, 2) NOT NULL,
    humidity NUMERIC(5, 2) NOT NULL,
    air_pressure NUMERIC(7, 2) NOT NULL,
    solar_radiation NUMERIC(7, 2) NOT NULL,
    heat_flux NUMERIC(7, 2) NOT NULL,
    delta_temperature NUMERIC(5, 2) NOT NULL,
    
    -- Location data
    gps_latitude NUMERIC(10, 7),
    gps_longitude NUMERIC(10, 7),
    
    -- Network data
    ip_address VARCHAR(45),
    country VARCHAR(100),
    
    -- Device identification
    device_id VARCHAR(100)
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Index for timestamp queries (last 25 minutes, historical data)
CREATE INDEX idx_sensor_data_timestamp 
ON sensor_data (timestamp DESC);

-- Index for GPS location queries (categorize by location)
CREATE INDEX idx_sensor_data_gps 
ON sensor_data (gps_latitude, gps_longitude);

-- Index for IP/Country queries (categorize by region)
CREATE INDEX idx_sensor_data_ip 
ON sensor_data (ip_address, country);

-- Index for device queries (multi-device support)
CREATE INDEX idx_sensor_data_device 
ON sensor_data (device_id);

-- Composite index for live data queries (timestamp + device)
CREATE INDEX idx_sensor_data_live 
ON sensor_data (timestamp DESC, device_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on the table
ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public INSERT (for ESP8266 devices)
CREATE POLICY "Allow public insert" 
ON sensor_data 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Policy: Allow public SELECT (for website data retrieval)
CREATE POLICY "Allow public select" 
ON sensor_data 
FOR SELECT 
TO anon 
USING (true);

-- ==========================================
-- AUTOMATIC DATA CLEANUP (OPTIONAL)
-- ==========================================
-- This function automatically deletes data older than 90 days
-- Run this if you want automatic cleanup to save storage

CREATE OR REPLACE FUNCTION cleanup_old_sensor_data()
RETURNS void AS $$
BEGIN
    DELETE FROM sensor_data 
    WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Uncomment the line below to enable automatic daily cleanup
-- SELECT cron.schedule('cleanup-old-data', '0 3 * * *', 'SELECT cleanup_old_sensor_data()');

-- ==========================================
-- VERIFICATION QUERY
-- ==========================================
-- Run this after creating the table to verify setup

SELECT 
    'sensor_data' as table_name,
    COUNT(*) as row_count,
    pg_size_pretty(pg_total_relation_size('sensor_data')) as table_size
FROM sensor_data;

-- ==========================================
-- EXAMPLE INSERT (Test Data)
-- ==========================================
-- Uncomment to insert test data

/*
INSERT INTO sensor_data (
    temperature, humidity, air_pressure, 
    solar_radiation, heat_flux, delta_temperature,
    gps_latitude, gps_longitude,
    ip_address, country, device_id
) VALUES (
    24.5, 65.0, 1013.25,
    650.0, 120.0, 2.3,
    6.9271, 79.8612,
    '192.168.1.45', 'Sri Lanka', 'fiaphy-001'
);
*/

-- ==========================================
-- SCHEMA COMPLETE
-- ==========================================
