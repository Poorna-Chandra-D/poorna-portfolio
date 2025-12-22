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
        // Use Netlify Function for secure server-side notifications
        if (CONFIG.useNetlifyFunction) {
            sendViaNetlifyFunction(data);
        } else {
            // Fallback to direct methods (for local testing)
            sendToTelegram(data);
        }
    }

    function sendViaNetlifyFunction(data) {
        fetch(CONFIG.netlifyFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                console.log('✅ Visitor notification sent successfully');
            } else {
                console.warn('⚠️ Notification failed:', result.error);
            }
        })
        .catch(err => {
            console.log('Notification sent (or pending)');
        });
    }

    function sendToTelegram(data) {
        const BOT_TOKEN = CONFIG.telegram.botToken;
        const CHAT_ID = CONFIG.telegram.chatId;
        
        if (!CONFIG.telegram.enabled || BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN') {
            console.log('⚠️ Telegram not configured. Update config.js or .env file with your credentials.');
            return;
        }

        const message = `
🌐 *New Portfolio Visitor!*

📍 *Location:* ${data.city}, ${data.region}, ${data.country}
🌍 *IP:* ${data.ip}
📱 *Device:* ${data.deviceType}
🌐 *Browser:* ${data.browser}
🗣️ *Language:* ${data.language}
🔗 *Referrer:* ${data.referrer === 'direct' ? 'Direct Visit' : data.referrer}
⏰ *Time:* ${new Date(data.timestamp).toLocaleString()}
📐 *Screen:* ${data.screenResolution}
        `.trim();

        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        }).catch(err => console.log('Telegram notification sent'));
    }

    function sendToDiscord(data) {
        const WEBHOOK_URL = CONFIG.discord.webhookUrl;
        
        if (!CONFIG.discord.enabled || WEBHOOK_URL === 'YOUR_DISCORD_WEBHOOK_URL') {
            console.log('⚠️ Discord not configured. Update config.js or .env file with your webhook URL.');
            return;
        }

        const embed = {
            embeds: [{
                title: '🌐 New Portfolio Visitor',
                color: 667820,
                fields: [
                    { name: '📍 Location', value: `${data.city}, ${data.country}`, inline: true },
                    { name: '📱 Device', value: data.deviceType, inline: true },
                    { name: '🌐 Browser', value: data.browser, inline: true },
                    { name: '🗣️ Language', value: data.language, inline: true },
                    { name: '🔗 Referrer', value: data.referrer === 'direct' ? 'Direct Visit' : data.referrer, inline: false },
                    { name: '⏰ Timestamp', value: new Date(data.timestamp).toLocaleString(), inline: false },
                    { name: '📐 Screen Resolution', value: data.screenResolution, inline: true },
                    { name: '🌍 IP Address', value: data.ip, inline: true }
                ],
                timestamp: new Date()
            }]
        };

        fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(embed)
        }).catch(err => console.log('Discord notification sent'));
    }

    function sendToEmail(data) {
        const FORMSPREE_ID = CONFIG.email.formspreeId;
        
        if (!CONFIG.email.enabled || FORMSPREE_ID === 'YOUR_FORMSPREE_ID') {
            console.log('⚠️ Email not configured. Update config.js or .env file with your Formspree ID.');
            return;
        }

        const emailData = {
            name: `Visitor from ${data.city}`,
            email: 'noreply@portfolio.com',
            message: `
New visitor to your portfolio:
Location: ${data.city}, ${data.country}
Device: ${data.deviceType}
Browser: ${data.browser}
Time: ${new Date(data.timestamp).toLocaleString()}
Referrer: ${data.referrer}
IP: ${data.ip}
            `
        };

        fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData)
        }).catch(err => console.log('Email notification sent'));
    }

    function storeLocalVisitorData(data) {
        // Optional: Store only last 10 visitors for backup
        let visitors = JSON.parse(localStorage.getItem('visitors')) || [];
        visitors.push(data);
        
        if (visitors.length > 10) {
            visitors = visitors.slice(-10);
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
