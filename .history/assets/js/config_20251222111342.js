// Configuration for Visitor Tracker
// Update these values with your actual credentials from .env file

const CONFIG = {
    // Telegram Configuration
    telegram: {
        botToken: '8249128073:AAFBpHGmlaQrOWhwc6mo4kDKR0Z8GhS1yhg',
        chatId: '8249128073',
        enabled: false // Set to true when configured
    },

    // Discord Configuration
    discord: {
        webhookUrl: 'YOUR_DISCORD_WEBHOOK_URL',
        enabled: false // Set to true when configured
    },

    // Email Configuration
    email: {
        formspreeId: 'YOUR_FORMSPREE_ID',
        enabled: false // Set to true when configured
    }
};

// Function to validate configuration
function validateConfig() {
    if (CONFIG.telegram.enabled && CONFIG.telegram.botToken === '8249128073:AAFBpHGmlaQrOWhwc6mo4kDKR0Z8GhS1yhg') {
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
