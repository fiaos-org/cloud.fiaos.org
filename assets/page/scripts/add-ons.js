// ============================================
// CLOUD.FIAOS.ORG - CUSTOM ADD-ONS JAVASCRIPT
// Override and extend external main.js functionality
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ============================================
    // Custom Theme Configuration for Cloud Site
    // ============================================
    const CLOUD_CONFIG = {
        siteName: 'Cloud FiaOS',
        themeVersion: '1.0.0',
        defaultTheme: 'light', // Can be 'light', 'dark', or 'system'
        enableAnimations: true,
        enableCustomCursor: false,
        accentColor: '#6366f1',
        secondaryColor: '#8b5cf6'
    };

    // ============================================
    // Override Theme System
    // ============================================
    function initCloudTheme() {
        const html = document.documentElement;
        const savedTheme = localStorage.getItem('cloud-theme');
        
        if (savedTheme) {
            html.setAttribute('data-theme', savedTheme);
        } else if (CLOUD_CONFIG.defaultTheme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            html.setAttribute('data-theme', CLOUD_CONFIG.defaultTheme);
        }
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (localStorage.getItem('cloud-theme') === 'system' || !localStorage.getItem('cloud-theme')) {
                html.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            }
        });
    }

    // Override theme toggle functionality
    function setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        themeToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('cloud-theme', newTheme);
            localStorage.setItem('theme', newTheme); // Also set for external JS compatibility
            
            updateThemeIcon(newTheme);
            
            // Add transition effect
            document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        });
    }

    function updateThemeIcon(theme) {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;
        
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'bi bi-moon-stars-fill' : 'bi bi-sun-fill';
        }
    }

    // ============================================
    // Enhanced Cookie Consent
    // ============================================
    function initCloudCookieConsent() {
        const cookieConsent = document.getElementById('cookieConsent');
        const acceptCookies = document.getElementById('acceptCookies');
        
        // Check if already accepted
        if (localStorage.getItem('cloud-cookie-consent') === 'accepted') {
            if (cookieConsent) cookieConsent.classList.add('hidden');
            return;
        }
        
        if (acceptCookies) {
            // Remove existing listeners and add new one
            const newAcceptBtn = acceptCookies.cloneNode(true);
            acceptCookies.parentNode.replaceChild(newAcceptBtn, acceptCookies);
            
            newAcceptBtn.addEventListener('click', function() {
                localStorage.setItem('cloud-cookie-consent', 'accepted');
                localStorage.setItem('fiaos-cookie-consent', 'accepted'); // Compatibility
                localStorage.setItem('cloud-consent-date', new Date().toISOString());
                
                if (cookieConsent) {
                    cookieConsent.style.transform = 'translateY(100%)';
                    setTimeout(() => {
                        cookieConsent.classList.add('hidden');
                    }, 300);
                }
            });
        }
    }

    // ============================================
    // Enhanced Announcement Ribbon
    // ============================================
    function initCloudAnnouncement() {
        const ribbon = document.getElementById('announcementRibbon');
        const dismissBtn = document.getElementById('dismissAnnouncement');
        
        const announcementVersion = 'cloud-v1.0';
        
        if (localStorage.getItem('cloud-announcement-dismissed') === announcementVersion) {
            if (ribbon) ribbon.classList.add('hidden');
            return;
        }
        
        if (dismissBtn) {
            const newDismissBtn = dismissBtn.cloneNode(true);
            dismissBtn.parentNode.replaceChild(newDismissBtn, dismissBtn);
            
            newDismissBtn.addEventListener('click', function() {
                localStorage.setItem('cloud-announcement-dismissed', announcementVersion);
                
                if (ribbon) {
                    ribbon.style.opacity = '0';
                    ribbon.style.transform = 'translateY(-100%)';
                    setTimeout(() => {
                        ribbon.classList.add('hidden');
                    }, 300);
                }
            });
        }
    }

    // ============================================
    // Smooth Scroll Enhancement
    // ============================================
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                
                e.preventDefault();
                const target = document.querySelector(href);
                
                if (target) {
                    const headerHeight = document.querySelector('.site-header')?.offsetHeight || 60;
                    const toolbarHeight = document.querySelector('.top-toolbar')?.offsetHeight || 0;
                    const offset = headerHeight + toolbarHeight + 20;
                    
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Update URL without jumping
                    history.pushState(null, null, href);
                }
            });
        });
    }

    // ============================================
    // Add Loading Animation
    // ============================================
    function initLoadingAnimation() {
        // Add fade-in animation to main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent && CLOUD_CONFIG.enableAnimations) {
            mainContent.style.opacity = '0';
            mainContent.style.transform = 'translateY(20px)';
            mainContent.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            
            setTimeout(() => {
                mainContent.style.opacity = '1';
                mainContent.style.transform = 'translateY(0)';
            }, 100);
        }
        
        // Animate cards on scroll
        if (CLOUD_CONFIG.enableAnimations) {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);
            
            document.querySelectorAll('.info-card, .doc-category, .publication-item').forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                observer.observe(card);
            });
        }
    }

    // ============================================
    // Keyboard Shortcuts
    // ============================================
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchToggle = document.getElementById('searchToggle');
                if (searchToggle) searchToggle.click();
            }
            
            // Ctrl/Cmd + D for dark mode toggle
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                const themeToggle = document.getElementById('themeToggle');
                if (themeToggle) themeToggle.click();
            }
        });
    }

    // ============================================
    // Console Branding
    // ============================================
    function showConsoleBranding() {
        console.clear();
        console.log('%c☁️ Cloud FiaOS', 'font-size: 24px; font-weight: bold; color: #6366f1;');
        console.log('%cEnvironmental Intelligence Platform', 'font-size: 14px; color: #8b5cf6;');
        console.log('%c─────────────────────────────────', 'color: #cbd5e1;');
        console.log('%cTheme Version: ' + CLOUD_CONFIG.themeVersion, 'font-size: 11px; color: #64748b;');
        console.log('%cPress Ctrl+K to search, Ctrl+D to toggle dark mode', 'font-size: 11px; color: #64748b;');
    }

    // ============================================
    // Back to Top Button
    // ============================================
    function initBackToTop() {
        // Create button if it doesn't exist
        let backToTop = document.getElementById('backToTop');
        
        if (!backToTop) {
            backToTop = document.createElement('button');
            backToTop.id = 'backToTop';
            backToTop.innerHTML = '<i class="bi bi-arrow-up"></i>';
            backToTop.setAttribute('aria-label', 'Back to top');
            backToTop.style.cssText = `
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                color: white;
                border: none;
                cursor: pointer;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.25rem;
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
            `;
            document.body.appendChild(backToTop);
        }
        
        // Show/hide based on scroll
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTop.style.opacity = '1';
                backToTop.style.visibility = 'visible';
            } else {
                backToTop.style.opacity = '0';
                backToTop.style.visibility = 'hidden';
            }
        });
        
        // Scroll to top on click
        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        // Hover effect
        backToTop.addEventListener('mouseenter', () => {
            backToTop.style.transform = 'translateY(-4px)';
        });
        
        backToTop.addEventListener('mouseleave', () => {
            backToTop.style.transform = 'translateY(0)';
        });
    }

    // ============================================
    // Initialize All Cloud Customizations
    // ============================================
    function init() {
        initCloudTheme();
        setupThemeToggle();
        initCloudCookieConsent();
        initCloudAnnouncement();
        initSmoothScroll();
        initLoadingAnimation();
        initKeyboardShortcuts();
        initBackToTop();
        showConsoleBranding();
        
        // Update theme icon on load
        const currentTheme = document.documentElement.getAttribute('data-theme');
        updateThemeIcon(currentTheme);
    }

    // Run initialization
    init();

    // ============================================
    // Expose Cloud Config for External Access
    // ============================================
    window.CloudFiaOS = {
        config: CLOUD_CONFIG,
        setTheme: function(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('cloud-theme', theme);
            localStorage.setItem('theme', theme);
            updateThemeIcon(theme);
        },
        getTheme: function() {
            return document.documentElement.getAttribute('data-theme');
        }
    };
});
