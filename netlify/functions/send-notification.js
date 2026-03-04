const ipState = new Map();
const recentFingerprints = new Map();

function getHeader(headers = {}, key) {
    return headers[key] || headers[key.toLowerCase()] || '';
}

function parseNumberEnv(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseListEnv(value = '') {
    return value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
}

function isLikelyBot(userAgent = '') {
    return /bot|crawler|spider|slurp|curl|wget|python|java|headless|monitor|uptime/i.test(userAgent);
}

function pruneMapByAge(map, now, maxAgeMs) {
    for (const [key, entry] of map.entries()) {
        const timestamp = typeof entry === 'number' ? entry : entry.lastSeen;
        if (!timestamp || now - timestamp > maxAgeMs) {
            map.delete(key);
        }
    }
}

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
        const headers = event.headers || {};
        const origin = getHeader(headers, 'origin');
        const referer = getHeader(headers, 'referer');
        const userAgent = getHeader(headers, 'user-agent') || data.userAgent || '';
        const clientIp = getHeader(headers, 'x-nf-client-connection-ip') || data.ip || 'unknown-ip';
        const isGuestbookEvent = !!(data.guestbook && data.guestbook.name);

        // Optional allowlist: comma-separated domains like https://example.com,https://www.example.com
        const allowedOrigins = parseListEnv(process.env.ALLOWED_ORIGINS);
        if (allowedOrigins.length > 0) {
            const isOriginAllowed = allowedOrigins.some(item => origin.startsWith(item));
            const isRefererAllowed = allowedOrigins.some(item => referer.startsWith(item));
            if (!isOriginAllowed && !isRefererAllowed) {
                return {
                    statusCode: 403,
                    body: JSON.stringify({ error: 'Forbidden origin' })
                };
            }
        }

        if (!isGuestbookEvent && isLikelyBot(userAgent)) {
            return {
                statusCode: 202,
                body: JSON.stringify({ skipped: true, reason: 'Likely bot traffic' })
            };
        }

        const now = Date.now();
        const visitCooldownMs = parseNumberEnv(process.env.NOTIFY_COOLDOWN_MINUTES, 30) * 60 * 1000;
        const rateWindowMs = parseNumberEnv(process.env.NOTIFY_RATE_WINDOW_MINUTES, 10) * 60 * 1000;
        const maxPerWindow = parseNumberEnv(process.env.NOTIFY_MAX_PER_WINDOW, 5);
        const dedupeMs = parseNumberEnv(process.env.NOTIFY_DEDUPE_SECONDS, 120) * 1000;

        pruneMapByAge(ipState, now, Math.max(visitCooldownMs, rateWindowMs));
        pruneMapByAge(recentFingerprints, now, dedupeMs);

        const fingerprint = `${clientIp}|${data.pageUrl || ''}|${data.deviceType || ''}|${data.browser || ''}|${data.guestbook?.name || ''}`;
        const lastFingerprintSeen = recentFingerprints.get(fingerprint);
        if (lastFingerprintSeen && now - lastFingerprintSeen < dedupeMs) {
            return {
                statusCode: 202,
                body: JSON.stringify({ skipped: true, reason: 'Duplicate notification' })
            };
        }
        recentFingerprints.set(fingerprint, now);

        const current = ipState.get(clientIp) || { windowStart: now, count: 0, lastSeen: 0 };
        if (now - current.windowStart > rateWindowMs) {
            current.windowStart = now;
            current.count = 0;
        }

        if (!isGuestbookEvent && current.lastSeen && now - current.lastSeen < visitCooldownMs) {
            return {
                statusCode: 202,
                body: JSON.stringify({ skipped: true, reason: 'Cooldown active for IP' })
            };
        }

        if (current.count >= maxPerWindow) {
            return {
                statusCode: 429,
                body: JSON.stringify({ error: 'Rate limit exceeded' })
            };
        }

        current.count += 1;
        current.lastSeen = now;
        ipState.set(clientIp, current);
        
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
