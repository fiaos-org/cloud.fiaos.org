// ============================================
// FIAPHY UI MODULE
// Handles UI updates and animations
// ============================================

const FiaphyUI = {
    // DOM Elements
    elements: {
        loadingScreen: null,
        dashboard: null,
        noDevice: null,
        dataGrid: null,
        connectionStatus: null,
        statusText: null,
        temperature: null,
        humidity: null,
        airPressure: null,
        solarRadiation: null,
        heatFlux: null,
        deltaTemperature: null
    },

    /**
     * Initialize UI module
     */
    init() {
        console.log('[UI] Initializing Fiaphy UI...');
        this.cacheElements();
    },

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            loadingScreen: document.getElementById('loadingScreen'),
            dashboard: document.getElementById('dashboard'),
            noDevice: document.getElementById('noDevice'),
            dataGrid: document.getElementById('dataGrid'),
            connectionStatus: document.getElementById('connectionStatus'),
            statusText: document.querySelector('#connectionStatus .status-text'),
            temperature: document.getElementById('temperature'),
            humidity: document.getElementById('humidity'),
            airPressure: document.getElementById('airPressure'),
            solarRadiation: document.getElementById('solarRadiation'),
            heatFlux: document.getElementById('heatFlux'),
            deltaTemperature: document.getElementById('deltaTemperature')
        };
    },

    /**
     * Hide loading screen and show dashboard
     */
    hideLoadingScreen() {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.style.display = 'none';
        }
        if (this.elements.dashboard) {
            this.elements.dashboard.classList.remove('hidden');
        }
        console.log('[UI] Loading screen hidden');
    },

    /**
     * Update connection status
     */
    updateConnectionStatus(isConnected) {
        const status = this.elements.connectionStatus;
        const text = this.elements.statusText;

        if (!status || !text) return;

        if (isConnected) {
            status.classList.add('connected');
            status.classList.remove('disconnected');
            text.textContent = 'Connected';
        } else {
            status.classList.remove('connected');
            status.classList.add('disconnected');
            text.textContent = 'Disconnected';
        }
    },

    /**
     * Show/hide no device state
     */
    toggleNoDevice(show) {
        if (show) {
            this.elements.noDevice?.classList.remove('hidden');
            this.elements.dataGrid?.classList.add('hidden');
        } else {
            this.elements.noDevice?.classList.add('hidden');
            this.elements.dataGrid?.classList.remove('hidden');
        }
    },

    /**
     * Update sensor data display
     */
    updateData(data) {
        if (!data) {
            this.toggleNoDevice(true);
            this.updateConnectionStatus(false);
            return;
        }

        this.toggleNoDevice(false);
        this.updateConnectionStatus(true);

        // Update each value with formatting
        this.updateValue('temperature', data.temperature, 1);
        this.updateValue('humidity', data.humidity, 0);
        this.updateValue('airPressure', data.airPressure, 2);
        this.updateValue('solarRadiation', data.solarRadiation, 0);
        this.updateValue('heatFlux', data.heatFlux, 1);
        this.updateValue('deltaTemperature', data.deltaTemperature, 2);

        console.log('[UI] Data updated', data);
    },

    /**
     * Update individual value
     */
    updateValue(key, value, decimals = 0) {
        const element = this.elements[key];
        if (!element) return;

        const formattedValue = typeof value === 'number' 
            ? value.toFixed(decimals)
            : '--';

        // Smooth transition
        element.style.opacity = '0.5';
        setTimeout(() => {
            element.textContent = formattedValue;
            element.style.opacity = '1';
        }, 100);
    },

    /**
     * Show error state
     */
    showError(message) {
        console.error('[UI] Error:', message);
        this.toggleNoDevice(true);
        this.updateConnectionStatus(false);
    },

    /**
     * Format number with thousands separator
     */
    formatNumber(num, decimals = 0) {
        if (typeof num !== 'number' || isNaN(num)) return '--';
        return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
};

// Export for use in other modules
window.FiaphyUI = FiaphyUI;
