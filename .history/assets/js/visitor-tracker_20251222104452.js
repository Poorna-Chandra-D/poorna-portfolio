// Visitor Tracking Script
(function() {
    // Get visitor information
    async function trackVisitor() {
        try {
            // Fetch geolocation data
            const geoResponse = await fetch('https://ipapi.co/json/');
            const geoData = await geoResponse.json();

            // Gather visitor information
            const visitorData = {
                timestamp: new Date().toISOString(),
                city: geoData.city || 'Unknown',
                region: geoData.region || 'Unknown',
                country: geoData.country_name || 'Unknown',
                ip: geoData.ip || 'Unknown',
                timezone: geoData.timezone || 'Unknown',
                browser: getBrowserInfo(),
                referrer: document.referrer || 'direct',
                userAgent: navigator.userAgent,
                language: navigator.language || 'Unknown',
                screenResolution: `${window.innerWidth}x${window.innerHeight}`,
                deviceType: getDeviceType(),
                pageUrl: window.location.href
            };

            // Log to console (for testing)
            console.log('Visitor tracked:', visitorData);

            // Send to your tracking service
            sendTrackerData(visitorData);

            // Store in localStorage for analytics
            storeLocalVisitorData(visitorData);

        } catch (error) {
            console.error('Error tracking visitor:', error);
        }
    }

    function getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        
        if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
        else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
        else if (ua.indexOf('Safari') > -1) browser = 'Safari';
        else if (ua.indexOf('Edge') > -1) browser = 'Edge';
        else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera';
        
        return browser;
    }

    function getDeviceType() {
        const ua = navigator.userAgent;
        if (/mobile/i.test(ua)) return 'Mobile';
        if (/tablet/i.test(ua)) return 'Tablet';
        return 'Desktop';
    }

    function sendTrackerData(data) {
        // Option 1: Send to Google Forms (creates a spreadsheet)
        const formId = 'YOUR_GOOGLE_FORM_ID'; // Replace with your form ID
        const formUrl = `https://docs.google.com/forms/d/e/${formId}/formResponse`;
        
        // Send as form data (adjust entry IDs based on your form)
        const formData = new FormData();
        formData.append('entry.123456789', data.timestamp); // Replace entry IDs
        formData.append('entry.987654321', data.city);
        formData.append('entry.111111111', data.country);
        formData.append('entry.222222222', data.browser);
        formData.append('entry.333333333', data.deviceType);

        // Use fetch with no-cors mode to avoid CORS issues
        fetch(formUrl, {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        }).catch(err => console.log('Tracker sent (CORS expected)'));

        // Option 2: Alternative - Send to Firebase (uncomment if using Firebase)
        // sendToFirebase(data);
    }

    function storeLocalVisitorData(data) {
        let visitors = JSON.parse(localStorage.getItem('visitors')) || [];
        visitors.push(data);
        
        // Keep only last 100 visitors
        if (visitors.length > 100) {
            visitors = visitors.slice(-100);
        }
        
        localStorage.setItem('visitors', JSON.stringify(visitors));
    }

    // Initialize tracking when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', trackVisitor);
    } else {
        trackVisitor();
    }
})();
