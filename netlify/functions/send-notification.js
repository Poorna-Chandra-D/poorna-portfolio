exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const data = JSON.parse(event.body);
        
        // Get credentials from Netlify environment variables
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (!BOT_TOKEN || !CHAT_ID) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Telegram credentials not configured' })
            };
        }

        // Format the message
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
${data.guestbook && data.guestbook.name ? `\n👤 *Name:* ${data.guestbook.name}` : ''}
${data.guestbook && data.guestbook.email ? `\n📧 *Email:* ${data.guestbook.email}` : ''}
${data.guestbook && data.guestbook.linkedIn ? `\n💼 *LinkedIn:* ${data.guestbook.linkedIn}` : ''}
        `.trim();

        // Send to Telegram
        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        
        const response = await fetch(telegramUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        const result = await response.json();

        if (result.ok) {
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'Notification sent' })
            };
        } else {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to send Telegram notification', details: result })
            };
        }

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
