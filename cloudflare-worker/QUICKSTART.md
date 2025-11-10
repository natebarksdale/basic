# Cloudflare Worker - Quick Start Guide

**TL;DR:** 5 commands to secure your API key properly.

## Prerequisites

- Node.js installed
- A Cloudflare account (free, no credit card needed)

---

## 🚀 Quick Setup (5 Minutes)

### 1. Install Wrangler

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

This opens a browser window - click "Allow" to authorize.

### 3. Navigate to Worker Directory

```bash
cd cloudflare-worker
```

### 4. Set Your API Key (Secret)

```bash
wrangler secret put OPENROUTER_API_KEY
```

When prompted, paste your OpenRouter API key:
```
sk-or-v1-your-actual-openrouter-api-key-here
```

### 5. Deploy

```bash
wrangler deploy
```

**Copy the URL** from the output, it will look like:
```
https://travel-guide-api-proxy.your-username.workers.dev
```

---

## 📝 Update Your Frontend

Open `/home/user/basic/travel-guide.js` and find line 12:

```javascript
const CLOUDFLARE_WORKER_URL = null;
```

Change it to:

```javascript
const CLOUDFLARE_WORKER_URL = 'https://travel-guide-api-proxy.your-username.workers.dev';
```

(Use your actual worker URL from step 5)

---

## 🎉 Done!

Commit and push your changes:

```bash
git add travel-guide.js
git commit -m "Switch to Cloudflare Worker for API security"
git push origin main
```

Your API key is now truly secure! 🔒

---

## 🧪 Test It

Open your site and try generating a travel guide. If it works, you're all set!

**Check the browser console** (F12) - if you see errors, check:
1. Worker URL is correct in `travel-guide.js`
2. Worker deployed successfully (`wrangler deploy`)
3. API key secret is set (`wrangler secret list` should show `OPENROUTER_API_KEY`)

---

## 🔧 Troubleshooting

### "Forbidden - Invalid origin"

Your domain isn't allowed. Edit `worker.js` line 18-23:

```javascript
const allowedOrigins = [
  'https://natebarksdale.xyz',           // Add your domain here
  'https://natebarksdale.github.io',
  'http://localhost:8000'
];
```

Then redeploy:
```bash
wrangler deploy
```

### "Server configuration error"

API key secret isn't set:
```bash
wrangler secret put OPENROUTER_API_KEY
```

---

## 📊 View Usage

See your worker stats:
```bash
wrangler tail
```

Or visit: https://dash.cloudflare.com/ → Workers & Pages → travel-guide-api-proxy

---

## 🔄 Making Changes

After editing `worker.js`:
```bash
wrangler deploy
```

No need to redeploy your frontend!

---

**That's it!** Full documentation in [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md)
