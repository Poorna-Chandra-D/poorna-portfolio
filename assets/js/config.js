// Configuration for Visitor Tracker
// Credentials are now stored securely in Netlify environment variables

const CONFIG = {
    // Use Netlify Function for secure notifications
    useNetlifyFunction: true,
    netlifyFunctionUrl: '/.netlify/functions/send-notification',
    
    // Telegram Configuration (for local testing only)
    telegram: {
        botToken: '', // Leave empty - set in Netlify env vars
        chatId: '', // Leave empty - set in Netlify env vars
        enabled: true
    },

    // Discord Configuration
    discord: {
        webhookUrl: '',
        enabled: false
    },

    // Email Configuration
    email: {
        formspreeId: '',
        enabled: false
    }
};

// Function to validate configuration
function validateConfig() {
    if (CONFIG.telegram.enabled && CONFIG.telegram.botToken === 'Your_Telegram_bot_Tocken) {
        console.warn('⚠️ Telegram is enabled but not configured. Update botToken in config.js');
    }
    if (CONFIG.discord.enabled && CONFIG.discord.webhookUrl === 'YOUR_DISCORD_WEBHOOK_URL') {
        console.warn('⚠️ Discord is enabled but not configured. Update webhookUrl in config.js');
    }
    if (CONFIG.email.enabled && CONFIG.email.formspreeId === 'YOUR_FORMSPREE_ID') {
        console.warn('⚠️ Email is enabled but not configured. Update formspreeId in config.js');
    }
}

// Validate on load
validateConfig();
