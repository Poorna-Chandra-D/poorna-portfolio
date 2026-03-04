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

function normalizeOrigin(input = '') {
    if (!input) return '';

    try {
        const parsed = new URL(input);
        return parsed.origin.toLowerCase();
    } catch (error) {
        return String(input).replace(/\/$/, '').toLowerCase();
    }
}

function isAllowedOrigin(originValue, allowlist) {
    const normalizedValue = normalizeOrigin(originValue);
    if (!normalizedValue) return false;

    return allowlist.some(item => {
        const normalizedItem = normalizeOrigin(item);
        return normalizedItem && normalizedValue === normalizedItem;
    });
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

function hasGuestbookData(guestbook) {
    if (!guestbook || typeof guestbook !== 'object') {
        return false;
    }

    return ['name', 'email', 'linkedIn']
        .some(key => String(guestbook[key] || '').trim().length > 0);
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
        const isGuestbookEvent = hasGuestbookData(data.guestbook);
        const forceNotify = data.forceNotify === true || data.forceNotify === 'true';

        // Optional allowlist: comma-separated domains like https://example.com,https://www.example.com
        const allowedOrigins = parseListEnv(process.env.ALLOWED_ORIGINS);
        const hasOriginSignals = !!(origin || referer);
        if (allowedOrigins.length > 0 && hasOriginSignals) {
            const isOriginAllowed = isAllowedOrigin(origin, allowedOrigins);
            const isRefererAllowed = isAllowedOrigin(referer, allowedOrigins);
            if (!isOriginAllowed && !isRefererAllowed) {
                return {
                    statusCode: 403,
                    body: JSON.stringify({ error: 'Forbidden origin' })
                };
            }
        }

        if (!isGuestbookEvent && !forceNotify && isLikelyBot(userAgent)) {
            return {
                statusCode: 202,
                body: JSON.stringify({ skipped: true, reason: 'Likely bot traffic' })
            };
        }

        const now = Date.now();
        const visitCooldownMs = parseNumberEnv(process.env.NOTIFY_COOLDOWN_MINUTES, 30) * 60 * 1000;
        const visitsBeforeCooldown = parseNumberEnv(process.env.NOTIFY_VISITS_BEFORE_COOLDOWN, 3);
        const rateWindowMs = parseNumberEnv(process.env.NOTIFY_RATE_WINDOW_MINUTES, 10) * 60 * 1000;
        const maxPerWindow = parseNumberEnv(process.env.NOTIFY_MAX_PER_WINDOW, 5);
        const dedupeMs = parseNumberEnv(process.env.NOTIFY_DEDUPE_SECONDS, 120) * 1000;

        pruneMapByAge(ipState, now, Math.max(visitCooldownMs, rateWindowMs));
        pruneMapByAge(recentFingerprints, now, dedupeMs);

        const fingerprint = `${clientIp}|${data.pageUrl || ''}|${data.deviceType || ''}|${data.browser || ''}|${data.timestamp || ''}|${data.guestbook?.name || ''}`;
        const lastFingerprintSeen = recentFingerprints.get(fingerprint);
        if (!forceNotify && lastFingerprintSeen && now - lastFingerprintSeen < dedupeMs) {
            return {
                statusCode: 202,
                body: JSON.stringify({ skipped: true, reason: 'Duplicate notification' })
            };
        }
        recentFingerprints.set(fingerprint, now);

        const current = ipState.get(clientIp) || {
            windowStart: now,
            count: 0,
            lastSeen: 0,
            burstWindowStart: now,
            burstCount: 0
        };
        if (now - current.windowStart > rateWindowMs) {
            current.windowStart = now;
            current.count = 0;
        }

        if (now - current.burstWindowStart > visitCooldownMs) {
            current.burstWindowStart = now;
            current.burstCount = 0;
        }

        if (!isGuestbookEvent && !forceNotify && current.burstCount >= visitsBeforeCooldown) {
            return {
                statusCode: 202,
                body: JSON.stringify({ skipped: true, reason: 'Cooldown active for IP (visit limit reached)' })
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

        if (!isGuestbookEvent && !forceNotify) {
            current.burstCount += 1;
        }

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
