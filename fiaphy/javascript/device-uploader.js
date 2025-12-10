/**
 * FIAPHY DEVICE UPLOADER
 * ======================
 * This file is loaded by the ESP8266 device from cloud.fiaos.org
 * It handles uploading sensor data to Supabase every 2 seconds
 * 
 * HOW IT WORKS:
 * 1. ESP8266 loads this file via HTTP: <script src="https://cloud.fiaos.org/fiaphy/javascript/device-uploader.js"></script>
 * 2. This script sends sensor data to Supabase REST API
 * 3. Includes GPS location (via browser geolocation API)
 * 4. Includes IP address and country (via ipapi.co)
 * 
 * LOADED BY: ESP8266 embedded device (cloud mode)
 * USAGE: Automatically starts uploading when loaded
 */

(function() {
    'use strict';

    // ==========================================
    // SUPABASE CONFIGURATION
    // ==========================================
    const SUPABASE_URL = 'https://uopikbgoyrmtknbomvgo.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvcGlrYmdveXJtdGtuYm9tdmdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzY5NDAsImV4cCI6MjA4MDk1Mjk0MH0.k-UqQrCkAmyPqE_kNO0xLe564lm55hpDlFTPpTsYOr4';
    const TABLE_NAME = 'sensor_data';

    // ==========================================
    // DEVICE CONFIGURATION
    // ==========================================
    const UPLOAD_INTERVAL = 2000; // 2 seconds (matches ESP8266 data refresh)
    const DEVICE_ID = 'fiaphy-' + Math.random().toString(36).substr(2, 9); // Generate unique device ID
    
    // ==========================================
    // STATE MANAGEMENT
    // ==========================================
    let gpsLocation = { latitude: null, longitude: null };
    let ipInfo = { ip: null, country: null };
    let uploadInterval = null;
    let isUploading = false;

    // ==========================================
    // GPS LOCATION RETRIEVAL
    // ==========================================
    function requestGPSLocation() {
        if (!navigator.geolocation) {
            console.warn('[Device Uploader] GPS not available');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                gpsLocation.latitude = position.coords.latitude;
                gpsLocation.longitude = position.coords.longitude;
                console.log('[Device Uploader] GPS acquired:', gpsLocation);
            },
            (error) => {
                console.warn('[Device Uploader] GPS error:', error.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    // ==========================================
    // IP & COUNTRY RETRIEVAL
    // ==========================================
    async function getIPInfo() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            if (!response.ok) throw new Error('IP API failed');
            
            const data = await response.json();
            ipInfo.ip = data.ip || null;
            ipInfo.country = data.country_name || null;
            
            console.log('[Device Uploader] IP info acquired:', ipInfo);
        } catch (error) {
            console.warn('[Device Uploader] IP info error:', error.message);
            
            // Fallback: try to get IP from device's /api/data endpoint
            try {
                const localResponse = await fetch('/api/data');
                const localData = await localResponse.json();
                if (localData.ip) {
                    ipInfo.ip = localData.ip;
                }
            } catch (fallbackError) {
                console.warn('[Device Uploader] Fallback IP failed');
            }
        }
    }

    // ==========================================
    // FETCH SENSOR DATA FROM DEVICE
    // ==========================================
    async function fetchDeviceData() {
        try {
            const response = await fetch('/api/data', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Device API error: ' + response.status);
            }

            const data = await response.json();
            
            // Validate required fields
            if (typeof data.temperature === 'undefined' ||
                typeof data.humidity === 'undefined' ||
                typeof data.airPressure === 'undefined' ||
                typeof data.solarRadiation === 'undefined' ||
                typeof data.heatFlux === 'undefined' ||
                typeof data.deltaTemperature === 'undefined') {
                throw new Error('Missing required sensor data fields');
            }

            return data;
        } catch (error) {
            console.error('[Device Uploader] Failed to fetch device data:', error);
            throw error;
        }
    }

    // ==========================================
    // UPLOAD DATA TO SUPABASE
    // ==========================================
    async function uploadToSupabase(sensorData) {
        if (isUploading) {
            console.log('[Device Uploader] Upload already in progress, skipping...');
            return;
        }

        isUploading = true;

        try {
            const payload = {
                temperature: parseFloat(sensorData.temperature),
                humidity: parseFloat(sensorData.humidity),
                air_pressure: parseFloat(sensorData.airPressure),
                solar_radiation: parseFloat(sensorData.solarRadiation),
                heat_flux: parseFloat(sensorData.heatFlux),
                delta_temperature: parseFloat(sensorData.deltaTemperature),
                gps_latitude: gpsLocation.latitude,
                gps_longitude: gpsLocation.longitude,
                ip_address: ipInfo.ip,
                country: ipInfo.country,
                device_id: DEVICE_ID
            };

            const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Supabase error ${response.status}: ${errorText}`);
            }

            console.log('[Device Uploader] ✓ Data uploaded successfully at', new Date().toISOString());

        } catch (error) {
            console.error('[Device Uploader] ✗ Upload failed:', error);
        } finally {
            isUploading = false;
        }
    }

    // ==========================================
    // MAIN UPLOAD LOOP
    // ==========================================
    async function uploadCycle() {
        try {
            // Fetch latest sensor data from device
            const sensorData = await fetchDeviceData();
            
            // Upload to Supabase
            await uploadToSupabase(sensorData);
            
        } catch (error) {
            console.error('[Device Uploader] Upload cycle error:', error);
        }
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================
    async function init() {
        console.log('[Device Uploader] Initializing...');
        console.log('[Device Uploader] Device ID:', DEVICE_ID);
        console.log('[Device Uploader] Upload interval:', UPLOAD_INTERVAL + 'ms');

        // Request GPS location (async, will update when available)
        requestGPSLocation();

        // Get IP information (async, will update when available)
        await getIPInfo();

        // Wait 2 seconds before first upload to ensure GPS/IP are ready
        setTimeout(() => {
            console.log('[Device Uploader] Starting upload loop...');
            
            // First upload
            uploadCycle();
            
            // Set up interval for continuous uploads
            uploadInterval = setInterval(uploadCycle, UPLOAD_INTERVAL);
            
            console.log('[Device Uploader] ✓ Uploader active');
        }, 2000);

        // Update GPS location every 30 seconds
        setInterval(requestGPSLocation, 30000);
    }

    // ==========================================
    // CLEANUP ON PAGE UNLOAD
    // ==========================================
    window.addEventListener('beforeunload', () => {
        if (uploadInterval) {
            clearInterval(uploadInterval);
            console.log('[Device Uploader] Stopped');
        }
    });

    // ==========================================
    // START
    // ==========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ==========================================
    // GLOBAL EXPOSURE (for debugging)
    // ==========================================
    window.FiaphyDeviceUploader = {
        version: '1.0.0',
        deviceId: DEVICE_ID,
        getStatus: () => ({
            isUploading,
            gpsLocation,
            ipInfo,
            uploadInterval: UPLOAD_INTERVAL
        }),
        forceUpload: uploadCycle
    };

})();
