# Cloudflare Worker API Proxy

This directory contains a Cloudflare Worker that acts as a secure proxy between your frontend and OpenRouter API.

## 🎯 Why Use This?

**Problem:** Embedding API keys in client-side JavaScript (even obfuscated) is insecure - anyone can extract them.

**Solution:** Keep the API key on a server (Cloudflare Worker) and only allow requests from your domain.

## 📁 Files

- **`worker.js`** - The Cloudflare Worker code (proxy logic)
- **`wrangler.toml`** - Configuration for deploying the worker
- **`MOBILE_SETUP.md`** - 📱 Web-only setup (no command line needed!)
- **`QUICKSTART.md`** - Command-line setup (requires Node.js)
- **`CLOUDFLARE_SETUP.md`** - Complete documentation
- **`README.md`** - This file

## 🚀 Getting Started

**📱 On mobile or prefer web interfaces?** Start with [MOBILE_SETUP.md](./MOBILE_SETUP.md) - No command line needed!

**💻 Have command line access?** Use [QUICKSTART.md](./QUICKSTART.md) for faster setup

**Want all the details?** Read [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md)

## 💰 Cost

**Free for most use cases:**
- 100,000 requests per day on free tier
- No credit card required
- Perfect for personal projects

If you exceed free tier: $0.15 per million additional requests (very cheap!)

## 🔒 Security Benefits

✅ API key never exposed to browser
✅ Domain whitelist (only your site can use it)
✅ Can add rate limiting per user
✅ Server-side request logging
✅ No obfuscation needed - real security

## 🎓 Learn More

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [OpenRouter API Docs](https://openrouter.ai/docs)

---

**Ready?** Open [QUICKSTART.md](./QUICKSTART.md) and let's get started! 🚀
