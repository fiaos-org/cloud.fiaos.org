// ============================================
// FIAPHY API MODULE
// Handles data fetching and API communication
// ============================================

const FiaphyAPI = {
    // Configuration
    config: {
        apiEndpoint: '/api/data', // Replace with actual API endpoint
        updateInterval: 5000, // 5 seconds
        timeout: 10000 // 10 seconds
    },

    // Connection state
    isConnected: false,
    
    // Mock data for demonstration (remove when real API is available)
    mockData: {
        temperature: 24.5,
        humidity: 65,
        airPressure: 1013.25,
        solarRadiation: 650,
        heatFlux: 120,
        deltaTemperature: 2.3
    },

    /**
     * Initialize API connection
     */
    init() {
        console.log('[API] Initializing Fiaphy API...');
        this.checkConnection();
    },

    /**
     * Check device connection status
     */
    async checkConnection() {
        try {
            // Simulate connection check
            // Replace with actual API call
            await this.delay(1000);
            
            // For now, assume device is connected
            this.isConnected = true;
            console.log('[API] Device connected');
            
            return this.isConnected;
        } catch (error) {
            console.error('[API] Connection check failed:', error);
            this.isConnected = false;
            return false;
        }
    },

    /**
     * Fetch current sensor data
     */
    async fetchData() {
        try {
            // In production, replace this with actual API call:
            // const response = await fetch(this.config.apiEndpoint);
            // const data = await response.json();
            // return data;

            // Simulate API delay
            await this.delay(500);

            // Return mock data with slight variations
            const data = {
                temperature: this.mockData.temperature + (Math.random() - 0.5) * 2,
                humidity: Math.max(0, Math.min(100, this.mockData.humidity + (Math.random() - 0.5) * 5)),
                airPressure: this.mockData.airPressure + (Math.random() - 0.5) * 5,
                solarRadiation: Math.max(0, this.mockData.solarRadiation + (Math.random() - 0.5) * 100),
                heatFlux: Math.max(0, this.mockData.heatFlux + (Math.random() - 0.5) * 20),
                deltaTemperature: this.mockData.deltaTemperature + (Math.random() - 0.5) * 1,
                timestamp: new Date().toISOString()
            };

            this.isConnected = true;
            return data;

        } catch (error) {
            console.error('[API] Failed to fetch data:', error);
            this.isConnected = false;
            throw error;
        }
    },

    /**
     * Start continuous data polling
     */
    startPolling(callback) {
        console.log('[API] Starting data polling...');
        
        const poll = async () => {
            try {
                const data = await this.fetchData();
                if (callback && typeof callback === 'function') {
                    callback(data);
                }
            } catch (error) {
                console.error('[API] Polling error:', error);
                if (callback && typeof callback === 'function') {
                    callback(null, error);
                }
            }
        };

        // Initial fetch
        poll();

        // Set up interval
        return setInterval(poll, this.config.updateInterval);
    },

    /**
     * Stop data polling
     */
    stopPolling(intervalId) {
        if (intervalId) {
            clearInterval(intervalId);
            console.log('[API] Stopped data polling');
        }
    },

    /**
     * Utility: Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return this.isConnected;
    }
};

// Export for use in other modules
window.FiaphyAPI = FiaphyAPI;
