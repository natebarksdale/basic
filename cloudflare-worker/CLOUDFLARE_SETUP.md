# Cloudflare Worker Setup Guide

This guide will walk you through setting up a Cloudflare Worker to proxy your OpenRouter API calls, providing **real security** by keeping your API key on the server.

## 🎯 Benefits

- ✅ **Real security** - API key never exposed to the browser
- ✅ **Domain restriction** - Only your site can use the proxy
- ✅ **Rate limiting** - Can add usage limits per user
- ✅ **Free tier** - 100,000 requests/day on Cloudflare's free plan
- ✅ **No credit card required** for free tier

---

## 📋 Prerequisites

- A Cloudflare account (free): https://dash.cloudflare.com/sign-up
- Node.js installed (for deploying the worker)

---

## 🚀 Step 1: Create Cloudflare Account

1. **Go to**: https://dash.cloudflare.com/sign-up
2. **Sign up** with your email
3. **Verify** your email address
4. **Skip** domain setup (not needed for Workers)

---

## 🔧 Step 2: Install Wrangler CLI

Wrangler is Cloudflare's CLI tool for deploying Workers.

```bash
# Install globally
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

This will open a browser window asking you to authorize wrangler.

---

## 📝 Step 3: Configure Your Worker

1. **Navigate to the worker directory**:
   ```bash
   cd cloudflare-worker
   ```

2. **Get your Account ID**:
   - Go to https://dash.cloudflare.com/
   - Click "Workers & Pages" in the left sidebar
   - Your Account ID is shown at the top right
   - Copy it

3. **Update `wrangler.toml`**:
   - Open `wrangler.toml`
   - Uncomment the `account_id` line
   - Replace `your-account-id-here` with your actual Account ID

---

## 🔑 Step 4: Set Your API Key Secret

```bash
# Navigate to cloudflare-worker directory
cd cloudflare-worker

# Set the secret (you'll be prompted to paste your API key)
wrangler secret put OPENROUTER_API_KEY
```

When prompted, paste your OpenRouter API key:
```
sk-or-v1-your-actual-openrouter-api-key-here
```

**Important:** This stores the key securely in Cloudflare - it's never in your code!

---

## 🚢 Step 5: Deploy the Worker

```bash
# Deploy to Cloudflare
wrangler deploy
```

After deployment, you'll see output like:
```
✅ Published travel-guide-api-proxy
   https://travel-guide-api-proxy.your-username.workers.dev
```

**Copy this URL** - you'll need it in the next step!

---

## 🔄 Step 6: Update Your Frontend

You need to update `travel-guide.js` to use the worker instead of calling OpenRouter directly.

**Find this in `travel-guide.js`** (around line 1544):
```javascript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
```

**Replace with your worker URL**:
```javascript
const response = await fetch('https://travel-guide-api-proxy.your-username.workers.dev', {
```

**Remove the Authorization header** (the worker handles this now):
```javascript
// OLD - Remove this line:
'Authorization': `Bearer ${AppState.apiKey}`,

// The worker adds the Authorization header automatically
```

---

## 🧪 Step 7: Test Locally (Optional)

You can test the worker locally before deploying:

```bash
# Start local dev server
wrangler dev

# Test with curl
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "model": "google/gemini-2.0-flash-thinking-exp:free",
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_tokens": 100
  }'
```

---

## 🔒 Step 8: Update Domain Restrictions (Important!)

In `worker.js`, update the `allowedOrigins` array with your actual domains:

```javascript
const allowedOrigins = [
  'https://natebarksdale.xyz',           // Your production domain
  'https://natebarksdale.github.io',     // GitHub Pages (if using)
  'http://localhost:8000',                // Local development
  'http://127.0.0.1:8000'                // Local development
];
```

**Then redeploy**:
```bash
wrangler deploy
```

---

## 📊 Step 9: Monitor Usage

View your worker's analytics:

1. Go to https://dash.cloudflare.com/
2. Click "Workers & Pages"
3. Click on `travel-guide-api-proxy`
4. View requests, errors, and performance metrics

**Free tier limits:**
- 100,000 requests per day
- 10ms CPU time per request
- More than enough for a personal project!

---

## 🐛 Troubleshooting

### Error: "Forbidden - Invalid origin"
- Check that your domain is in the `allowedOrigins` array
- Make sure you redeployed after updating the domains

### Error: "Server configuration error"
- The `OPENROUTER_API_KEY` secret isn't set
- Run: `wrangler secret put OPENROUTER_API_KEY`

### Error: "Method not allowed"
- Make sure you're using POST requests
- The worker only accepts POST for API calls

### Test the Worker Directly

```bash
# Test with curl (replace with your worker URL)
curl -X POST https://travel-guide-api-proxy.your-username.workers.dev \
  -H "Content-Type: application/json" \
  -H "Origin: https://natebarksdale.xyz" \
  -d '{
    "model": "google/gemini-2.0-flash-thinking-exp:free",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 50
  }'
```

---

## 🎉 Benefits vs Obfuscation

| Feature | Obfuscation | Cloudflare Worker |
|---------|-------------|-------------------|
| API Key Exposed | ❌ Yes (in browser) | ✅ No (server-side) |
| Domain Restriction | ⚠️ OpenRouter Site Lock | ✅ Built-in |
| Rate Limiting | ❌ No | ✅ Can add |
| Cost | ✅ Free | ✅ Free (100k req/day) |
| Setup Complexity | ✅ Simple | ⚠️ Medium |
| Real Security | ❌ No | ✅ Yes |

---

## 🔄 Updating the Worker

Make changes to `worker.js`, then:

```bash
cd cloudflare-worker
wrangler deploy
```

No need to redeploy your frontend - the worker URL stays the same!

---

## 💰 Cost Breakdown

**Cloudflare Workers (Free Tier):**
- ✅ 100,000 requests/day
- ✅ No credit card required
- ✅ Unlimited workers
- If you exceed: $0.15 per million requests (very cheap)

**Paid plan** (only if you need more):
- $5/month
- 10 million requests included
- Then $0.30 per million additional requests

For a personal project, you'll likely stay well within the free tier!

---

## 📚 Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [OpenRouter Docs](https://openrouter.ai/docs)

---

## ✅ Checklist

- [ ] Created Cloudflare account
- [ ] Installed wrangler CLI (`npm install -g wrangler`)
- [ ] Logged in (`wrangler login`)
- [ ] Added account_id to `wrangler.toml`
- [ ] Set API key secret (`wrangler secret put OPENROUTER_API_KEY`)
- [ ] Updated `allowedOrigins` in `worker.js`
- [ ] Deployed worker (`wrangler deploy`)
- [ ] Updated frontend to use worker URL
- [ ] Tested the integration
- [ ] Deployed frontend changes to GitHub Pages

---

🎉 **That's it!** Your API key is now truly secure, hidden on the server side where no one can extract it.
