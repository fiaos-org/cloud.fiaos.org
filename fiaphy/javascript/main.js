// ============================================
// FIAPHY MAIN APPLICATION
// Application initialization and coordination
// ============================================

const FiaphyApp = {
    // Application state
    pollingInterval: null,
    isInitialized: false,

    /**
     * Initialize the application
     */
    async init() {
        console.log('[APP] Starting Fiaphy Environmental Monitoring System...');

        // Show loading screen for minimum duration
        const minLoadTime = 1500; // 1.5 seconds minimum
        const startTime = Date.now();

        try {
            // Initialize modules
            FiaphyUI.init();
            FiaphyAPI.init();

            // Check device connection
            const isConnected = await FiaphyAPI.checkConnection();

            // Calculate remaining load time
            const elapsed = Date.now() - startTime;
            const remainingTime = Math.max(0, minLoadTime - elapsed);

            // Wait for minimum load time
            if (remainingTime > 0) {
                await this.delay(remainingTime);
            }

            // Hide loading screen
            FiaphyUI.hideLoadingScreen();

            // Start data polling if connected
            if (isConnected) {
                this.startDataPolling();
            } else {
                FiaphyUI.showError('Device not connected');
            }

            this.isInitialized = true;
            console.log('[APP] Application initialized successfully');

        } catch (error) {
            console.error('[APP] Initialization failed:', error);
            FiaphyUI.hideLoadingScreen();
            FiaphyUI.showError('Failed to initialize application');
        }
    },

    /**
     * Start continuous data polling
     */
    startDataPolling() {
        console.log('[APP] Starting data polling...');

        this.pollingInterval = FiaphyAPI.startPolling((data, error) => {
            if (error) {
                console.error('[APP] Data fetch error:', error);
                FiaphyUI.showError('Failed to fetch data');
                return;
            }

            if (data) {
                FiaphyUI.updateData(data);
            }
        });
    },

    /**
     * Stop data polling
     */
    stopDataPolling() {
        if (this.pollingInterval) {
            FiaphyAPI.stopPolling(this.pollingInterval);
            this.pollingInterval = null;
            console.log('[APP] Data polling stopped');
        }
    },

    /**
     * Handle visibility change (pause polling when tab is hidden)
     */
    handleVisibilityChange() {
        if (document.hidden) {
            console.log('[APP] Tab hidden, pausing polling');
            this.stopDataPolling();
        } else {
            console.log('[APP] Tab visible, resuming polling');
            if (this.isInitialized) {
                this.startDataPolling();
            }
        }
    },

    /**
     * Utility: Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Cleanup on page unload
     */
    cleanup() {
        console.log('[APP] Cleaning up...');
        this.stopDataPolling();
    }
};

// ============================================
// APPLICATION ENTRY POINT
// ============================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        FiaphyApp.init();
    });
} else {
    FiaphyApp.init();
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    FiaphyApp.handleVisibilityChange();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    FiaphyApp.cleanup();
});

// Handle errors
window.addEventListener('error', (event) => {
    console.error('[APP] Global error:', event.error);
});

// Log application info
console.log('%cFiaphy Environmental Monitoring System', 'font-size: 16px; font-weight: bold; color: #ffffff;');
console.log('%cPart of FiaOS Research Initiative', 'font-size: 12px; color: #888888;');
console.log('%chttps://fiaos.org', 'font-size: 11px; color: #666666;');
