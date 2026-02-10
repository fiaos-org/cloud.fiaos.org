// Plain site helpers for cloud.fiaos.org.

document.addEventListener('DOMContentLoaded', function() {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('cloud-theme', 'light');
    localStorage.setItem('theme', 'light');

    const cookieConsent = document.getElementById('cookieConsent');
    const acceptCookies = document.getElementById('acceptCookies');

    if (localStorage.getItem('cloud-cookie-consent') === 'accepted') {
        if (cookieConsent) cookieConsent.classList.add('hidden');
    }

    if (acceptCookies) {
        acceptCookies.addEventListener('click', function() {
            localStorage.setItem('cloud-cookie-consent', 'accepted');
            localStorage.setItem('fiaos-cookie-consent', 'accepted');
            localStorage.setItem('cloud-consent-date', new Date().toISOString());
            if (cookieConsent) cookieConsent.classList.add('hidden');
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(event) {
            const href = anchor.getAttribute('href');
            if (!href || href === '#') return;

            const target = document.querySelector(href);
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView();
            history.pushState(null, '', href);
        });
    });

    window.CloudFiaOS = {
        setTheme: function() {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('cloud-theme', 'light');
            localStorage.setItem('theme', 'light');
        },
        getTheme: function() {
            return 'light';
        }
    };
});
