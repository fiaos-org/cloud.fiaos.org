/**
 * FIAPHY LIVE DATA FETCHER
 * =========================
 * This file is loaded by the cloud.fiaos.org website
 * It retrieves the last 25 minutes of sensor data from Supabase
 * Implements FIFO (First-In-First-Out) rolling window
 * 
 * REPLACES: api.js (mock data)
 * LOADED BY: cloud.fiaos.org/fiaphy/index.html
 */

const FiaphyLiveData = {
    // ==========================================
    // CONFIGURATION
    // ==========================================
    config: {
        supabaseUrl: 'https://uopikbgoyrmtknbomvgo.supabase.co',
        supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvcGlrYmdveXJtdGtuYm9tdmdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzY5NDAsImV4cCI6MjA4MDk1Mjk0MH0.k-UqQrCkAmyPqE_kNO0xLe564lm55hpDlFTPpTsYOr4',
        tableName: 'sensor_data',
        liveWindowMinutes: 25, // Data within last 25 minutes is considered "live"
        updateInterval: 5000,  // Update every 5 seconds
        maxRecords: 750        // 25 min * 60 sec / 2 sec = 750 records max
    },

    // ==========================================
    // STATE
    // ==========================================
    state: {
        isConnected: false,
        liveData: [],
        latestReading: null,
        pollingInterval: null,
        lastUpdateTime: null
    },

    // ==========================================
    // INITIALIZE
    // ==========================================
    init() {
        console.log('[Live Data] Initializing Supabase connection...');
        this.checkConnection();
    },

    // ==========================================
    // CONNECTION CHECK
    // ==========================================
    async checkConnection() {
        try {
            // Test connection by fetching 1 record
            const response = await fetch(
                `${this.config.supabaseUrl}/rest/v1/${this.config.tableName}?limit=1`,
                {
                    headers: {
                        'apikey': this.config.supabaseKey,
                        'Authorization': `Bearer ${this.config.supabaseKey}`
                    }
                }
            );

            if (response.ok) {
                this.state.isConnected = true;
                console.log('[Live Data] ✓ Connection established');
                return true;
            } else {
                const errorText = await response.text();
                let errorDetail = 'Connection failed';
                
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.code === 'PGRST205') {
                        errorDetail = 'Database table not found. Please run supabase-schema.sql';
                        console.error('[Live Data] ⚠️ DATABASE NOT SET UP!');
                        console.error('[Live Data] Run supabase-schema.sql in Supabase dashboard');
                    } else {
                        errorDetail = errorJson.message || errorText;
                    }
                } catch (e) {
                    errorDetail = errorText;
                }
                
                throw new Error(errorDetail);
            }
        } catch (error) {
            console.error('[Live Data] ✗ Connection error:', error.message);
            this.state.isConnected = false;
            return false;
        }
    },

    // ==========================================
    // FETCH LIVE DATA (Last 25 minutes)
    // ==========================================
    async fetchLiveData() {
        try {
            // Calculate timestamp for 25 minutes ago
            const twentyFiveMinutesAgo = new Date();
            twentyFiveMinutesAgo.setMinutes(twentyFiveMinutesAgo.getMinutes() - this.config.liveWindowMinutes);
            const isoTimestamp = twentyFiveMinutesAgo.toISOString();

            // Fetch data from Supabase
            const response = await fetch(
                `${this.config.supabaseUrl}/rest/v1/${this.config.tableName}?timestamp=gte.${isoTimestamp}&order=timestamp.desc&limit=${this.config.maxRecords}`,
                {
                    headers: {
                        'apikey': this.config.supabaseKey,
                        'Authorization': `Bearer ${this.config.supabaseKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                let errorDetail = `Supabase error: ${response.status}`;
                
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.code === 'PGRST205') {
                        errorDetail = 'Database table not found. Please run supabase-schema.sql in Supabase dashboard.';
                        console.error('[Live Data] ⚠️ Table "sensor_data" does not exist');
                    } else {
                        errorDetail = errorJson.message || errorText;
                    }
                } catch (e) {
                    errorDetail = errorText;
                }
                
                throw new Error(errorDetail);
            }

            const data = await response.json();
            
            // Update state
            this.state.liveData = data;
            this.state.isConnected = true;
            this.state.lastUpdateTime = new Date();

            // Get most recent reading
            if (data.length > 0) {
                this.state.latestReading = data[0];
            }

            console.log(`[Live Data] ✓ Fetched ${data.length} records from last ${this.config.liveWindowMinutes} minutes`);
            
            return data;

        } catch (error) {
            console.error('[Live Data] ✗ Fetch error:', error.message);
            this.state.isConnected = false;
            throw error;
        }
    },

    // ==========================================
    // GET LATEST READING (for dashboard display)
    // ==========================================
    async getLatestReading() {
        try {
            await this.fetchLiveData();
            
            if (!this.state.latestReading) {
                return null;
            }

            // Format data for dashboard compatibility
            return {
                temperature: this.state.latestReading.temperature,
                humidity: this.state.latestReading.humidity,
                airPressure: this.state.latestReading.air_pressure,
                solarRadiation: this.state.latestReading.solar_radiation,
                heatFlux: this.state.latestReading.heat_flux,
                deltaTemperature: this.state.latestReading.delta_temperature,
                timestamp: this.state.latestReading.timestamp,
                gps: {
                    latitude: this.state.latestReading.gps_latitude,
                    longitude: this.state.latestReading.gps_longitude
                },
                ip: this.state.latestReading.ip_address,
                country: this.state.latestReading.country,
                deviceId: this.state.latestReading.device_id
            };

        } catch (error) {
            console.error('[Live Data] Failed to get latest reading:', error);
            return null;
        }
    },

    // ==========================================
    // GET ALL LIVE DATA (25-minute window)
    // ==========================================
    async getAllLiveData() {
        try {
            await this.fetchLiveData();
            
            // Format all records for compatibility
            return this.state.liveData.map(record => ({
                temperature: record.temperature,
                humidity: record.humidity,
                airPressure: record.air_pressure,
                solarRadiation: record.solar_radiation,
                heatFlux: record.heat_flux,
                deltaTemperature: record.delta_temperature,
                timestamp: record.timestamp,
                gps: {
                    latitude: record.gps_latitude,
                    longitude: record.gps_longitude
                },
                ip: record.ip_address,
                country: record.country,
                deviceId: record.device_id
            }));

        } catch (error) {
            console.error('[Live Data] Failed to get all live data:', error);
            return [];
        }
    },

    // ==========================================
    // START POLLING (Auto-refresh)
    // ==========================================
    startPolling(callback) {
        console.log('[Live Data] Starting polling...');

        // Initial fetch
        this.getLatestReading().then(data => {
            if (callback) callback(data, null);
        }).catch(error => {
            if (callback) callback(null, error);
        });

        // Set up interval
        this.state.pollingInterval = setInterval(async () => {
            try {
                const data = await this.getLatestReading();
                if (callback) callback(data, null);
            } catch (error) {
                if (callback) callback(null, error);
            }
        }, this.config.updateInterval);

        return this.state.pollingInterval;
    },

    // ==========================================
    // STOP POLLING
    // ==========================================
    stopPolling() {
        if (this.state.pollingInterval) {
            clearInterval(this.state.pollingInterval);
            this.state.pollingInterval = null;
            console.log('[Live Data] Polling stopped');
        }
    },

    // ==========================================
    // GET STATISTICS (for dashboard insights)
    // ==========================================
    getStatistics() {
        if (this.state.liveData.length === 0) {
            return null;
        }

        const temps = this.state.liveData.map(d => d.temperature);
        const humidities = this.state.liveData.map(d => d.humidity);
        const pressures = this.state.liveData.map(d => d.air_pressure);
        const solar = this.state.liveData.map(d => d.solar_radiation);

        return {
            temperature: {
                current: temps[0],
                avg: temps.reduce((a, b) => a + b, 0) / temps.length,
                min: Math.min(...temps),
                max: Math.max(...temps)
            },
            humidity: {
                current: humidities[0],
                avg: humidities.reduce((a, b) => a + b, 0) / humidities.length,
                min: Math.min(...humidities),
                max: Math.max(...humidities)
            },
            pressure: {
                current: pressures[0],
                avg: pressures.reduce((a, b) => a + b, 0) / pressures.length,
                min: Math.min(...pressures),
                max: Math.max(...pressures)
            },
            solarRadiation: {
                current: solar[0],
                avg: solar.reduce((a, b) => a + b, 0) / solar.length,
                min: Math.min(...solar),
                max: Math.max(...solar)
            },
            recordCount: this.state.liveData.length,
            timeWindow: this.config.liveWindowMinutes,
            lastUpdate: this.state.lastUpdateTime
        };
    },

    // ==========================================
    // GET CONNECTION STATUS
    // ==========================================
    isConnected() {
        return this.state.isConnected;
    }
};

// ==========================================
// BACKWARD COMPATIBILITY WITH api.js
// ==========================================
// This ensures existing code using FiaphyAPI still works

const FiaphyAPI = {
    config: {
        apiEndpoint: '/api/data', // Not used anymore, but kept for compatibility
        updateInterval: FiaphyLiveData.config.updateInterval
    },
    
    isConnected: false,

    init() {
        return FiaphyLiveData.init();
    },

    async checkConnection() {
        const result = await FiaphyLiveData.checkConnection();
        this.isConnected = result;
        return result;
    },

    async fetchData() {
        const data = await FiaphyLiveData.getLatestReading();
        this.isConnected = data !== null;
        
        if (!data) {
            throw new Error('No data available');
        }
        
        return data;
    },

    startPolling(callback) {
        return FiaphyLiveData.startPolling(callback);
    },

    stopPolling(intervalId) {
        FiaphyLiveData.stopPolling();
    }
};

// ==========================================
// EXPORT FOR GLOBAL USE
// ==========================================
if (typeof window !== 'undefined') {
    window.FiaphyLiveData = FiaphyLiveData;
    window.FiaphyAPI = FiaphyAPI; // Backward compatibility
}
