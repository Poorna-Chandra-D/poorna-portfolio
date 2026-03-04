# Portfolio Visitor Tracker - Deployment Guide

## 🚀 Deploy to Netlify with Secure Credentials

### Step 1: Push to Git

```bash
git add .
git commit -m "Add secure visitor tracker with Netlify Functions"
git push origin main
```

### Step 2: Deploy on Netlify

1. Go to [Netlify](https://netlify.com) and login
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repository
4. Netlify will auto-detect settings (no build command needed)
5. Click **"Deploy site"**

### Step 3: Add Environment Variables

After deployment, add your credentials securely:

1. Go to your site dashboard on Netlify
2. Navigate to: **Site settings** → **Environment variables**
3. Click **"Add a variable"** and add these:

   | Key | Value |
   |-----|-------|
   | `TELEGRAM_BOT_TOKEN` | `Add yours` |
   | `TELEGRAM_CHAT_ID` | `Add yours` |
   | `ALLOWED_ORIGINS` | `https://your-site.netlify.app,https://yourdomain.com` |
   | `NOTIFY_COOLDOWN_MINUTES` | `30` |
   | `NOTIFY_RATE_WINDOW_MINUTES` | `10` |
   | `NOTIFY_MAX_PER_WINDOW` | `5` |
   | `NOTIFY_DEDUPE_SECONDS` | `120` |

4. Click **"Save"**
5. Go to **Deploys** → **"Trigger deploy"** → **"Clear cache and deploy site"**

### 🚨 If You Suspect Telegram Token Leak

1. Open Telegram and message **@BotFather**
2. Run `/revoke` for your bot to invalidate the old token
3. Run `/token` to generate a new token
4. Update `TELEGRAM_BOT_TOKEN` in Netlify immediately
5. Trigger a fresh deploy

Until the token is rotated, attackers can send messages directly to your bot even if your website code is fixed.

### Step 4: Test Your Deployment

1. Visit your Netlify site URL (e.g., `yoursite.netlify.app`)
2. Check your Telegram for a visitor notification
3. Success! 🎉

## 🔒 Security Benefits

✅ Credentials hidden from browser source code  
✅ Only your Netlify backend can access secrets  
✅ No risk of token exposure  
✅ Environment variables never pushed to Git  

## 🧪 Local Testing

For local testing with credentials:

1. Edit `assets/js/config.js`
2. Set `useNetlifyFunction: false`
3. Add your credentials to the telegram object
4. Test locally
5. **Don't forget to change back before pushing!**

## 📁 Files Deployed

- All HTML, CSS, JS files ✅
- Netlify Function (serverless backend) ✅
- Configuration (without secrets) ✅
- `.env` file (ignored by Git) ❌

## 🆘 Troubleshooting

**Notifications not working?**
1. Check Netlify function logs: Site settings → Functions
2. Verify environment variables are set correctly
3. Check Telegram bot is started (send `/start` to bot)
4. Verify Chat ID is your personal chat, not bot ID

**Function errors?**
- Check Netlify function logs
- Ensure you triggered a new deploy after adding env vars
- Test the function directly: `yoursite.netlify.app/.netlify/functions/send-notification`

**Still getting spam?**
- Confirm token was rotated in BotFather
- Ensure `ALLOWED_ORIGINS` exactly matches your live domain(s)
- Increase `NOTIFY_COOLDOWN_MINUTES` and reduce `NOTIFY_MAX_PER_WINDOW`

---

Need help? Check the [Netlify Functions docs](https://docs.netlify.com/functions/overview/)
