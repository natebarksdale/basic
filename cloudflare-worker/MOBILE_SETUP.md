# 📱 Cloudflare Worker Setup - Mobile/Web Only

**No command line needed!** Everything can be done through web interfaces on your phone.

---

## ⏱️ Time Required: 10 minutes

---

## 🚀 Step 1: Create Cloudflare Account (2 min)

1. **Open**: https://dash.cloudflare.com/sign-up
2. **Enter** your email and create a password
3. **Verify** your email (check your inbox)
4. **Skip** domain setup (click "Workers & Pages" in left menu instead)

---

## 🔨 Step 2: Create Your Worker (3 min)

1. **In Cloudflare dashboard**, click **"Workers & Pages"** in left sidebar
2. Click **"Create application"** button
3. Click **"Create Worker"** tab
4. **Name** it: `travel-guide-api-proxy`
5. Click **"Deploy"** (deploys a placeholder worker)
6. **Copy the URL** shown - it looks like:
   ```
   https://travel-guide-api-proxy.YOUR-USERNAME.workers.dev
   ```
   **Save this URL** - you'll need it later!

---

## ✏️ Step 3: Paste the Worker Code (2 min)

1. Click **"Edit code"** button (on the worker page)
2. **Delete all the placeholder code** in the editor
3. **Open this file** in a new tab:
   https://github.com/YOUR-USERNAME/basic/blob/main/cloudflare-worker/worker.js
4. Click **"Raw"** button to see the plain code
5. **Select all** (triple-tap and "Select All") and **copy**
6. **Go back** to Cloudflare tab
7. **Paste** the code into the editor
8. **Important:** Find line 18-23 in the code and change the domains:
   ```javascript
   const allowedOrigins = [
     'https://natebarksdale.xyz',           // Your actual domain
     'https://natebarksdale.github.io',     // If using GitHub Pages
     'http://localhost:8000'                // Keep for testing
   ];
   ```
9. Click **"Save and Deploy"** button

---

## 🔑 Step 4: Add Your API Key Secret (2 min)

1. Still on the worker page, click **"Settings"** tab
2. Scroll down to **"Environment Variables"** section
3. Click **"Add variable"** button
4. **Variable name**: `OPENROUTER_API_KEY`
5. **Value**: Paste your OpenRouter API key:
   ```
   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
   ```
6. Check the **"Encrypt"** box (this makes it a secret)
7. Click **"Save"**

⚠️ **Important:** After adding the variable, you must **redeploy**:
- Click **"Deployments"** tab
- Click **"Edit code"** again
- Click **"Save and Deploy"** (even without changes)

---

## 📝 Step 5: Update Your Frontend (3 min)

Now we need to tell your website to use the worker.

### Option A: GitHub Web Editor (Easiest on mobile)

1. **Go to**: https://github.com/YOUR-USERNAME/basic
2. **Click** on `travel-guide.js` file
3. **Click** the pencil icon (✏️ Edit) in top right
4. **Find line 12** (use Ctrl+F / Find in page):
   ```javascript
   const CLOUDFLARE_WORKER_URL = null;
   ```
5. **Change it to** (use YOUR worker URL from Step 2):
   ```javascript
   const CLOUDFLARE_WORKER_URL = 'https://travel-guide-api-proxy.YOUR-USERNAME.workers.dev';
   ```
6. **Scroll down**, add commit message:
   ```
   Enable Cloudflare Worker API proxy
   ```
7. Select **"Commit directly to main branch"**
8. Click **"Commit changes"**

### Option B: Through a PR (if you want to review first)

- Same as above, but choose "Create a new branch" instead
- Then create and merge the PR

---

## ✅ Step 6: Test It! (1 min)

1. **Wait 2-3 minutes** for GitHub Pages to rebuild
2. **Visit your site**: https://natebarksdale.xyz/basic/travel-guide.html
3. **Hard refresh** (usually long-press the refresh button → "Hard refresh")
4. **Try generating a travel guide!**

If it works, you're done! 🎉

---

## 🧪 Quick Test (Optional)

Test your worker directly to make sure it's working:

1. **Install a REST client app** on your phone (like "HTTP Request Tester" or similar)
2. **Create a POST request**:
   - **URL**: Your worker URL
   - **Method**: POST
   - **Headers**:
     - `Content-Type: application/json`
     - `Origin: https://natebarksdale.xyz`
   - **Body**:
     ```json
     {
       "model": "google/gemini-2.0-flash-thinking-exp:free",
       "messages": [{"role": "user", "content": "Say hello"}],
       "max_tokens": 50
     }
     ```
3. **Send** - you should get a response with AI-generated text!

Or use an online tool like https://reqbin.com/

---

## 🐛 Troubleshooting

### "Forbidden - Invalid origin"
- You forgot to update `allowedOrigins` in the worker code (Step 3, #8)
- Go back to worker → Edit code → Update domains → Save and Deploy

### "Server configuration error"
- API key secret wasn't set or didn't save
- Go to Settings → Environment Variables → Check if `OPENROUTER_API_KEY` exists
- If not, add it again (Step 4)
- **Must redeploy** after adding variables!

### Site still shows "Invalid API key"
- Your site hasn't updated yet
- Wait a few minutes for GitHub Pages to rebuild
- Hard refresh the page (clear cache)
- Check that you updated line 12 in `travel-guide.js`

### Worker URL not working
- Make sure you copied the FULL URL including `https://`
- Check for typos in `travel-guide.js`

---

## 📊 Monitor Your Worker

**View usage and logs:**

1. Go to Cloudflare dashboard
2. Click "Workers & Pages"
3. Click on your worker
4. See requests, errors, and performance

**Free tier limits:**
- ✅ 100,000 requests/day
- ✅ Way more than you need!

---

## 🔄 Making Changes Later

### To update the worker code:
1. Cloudflare dashboard → Workers & Pages → Your worker
2. Click "Edit code"
3. Make changes
4. Click "Save and Deploy"

### To change environment variables:
1. Settings → Environment Variables
2. Edit or add variables
3. **Must redeploy** (go to Edit code → Save and Deploy)

---

## 💡 Pro Tips

1. **Bookmark** your worker page in Cloudflare for quick access
2. **Save** your worker URL somewhere (Notes app)
3. **Check** the Cloudflare dashboard if something's not working
4. **Hard refresh** your site after making changes (clear cache)

---

## ✨ Benefits You Now Have

- ✅ API key is **truly secure** (never in browser)
- ✅ Only **your domain** can use it
- ✅ Free **100k requests/day**
- ✅ Can add **rate limiting** later if needed
- ✅ View **analytics** in Cloudflare dashboard

---

## 📚 Summary

What you did:
1. ✅ Created Cloudflare account
2. ✅ Created worker (deployed the proxy code)
3. ✅ Added API key as encrypted secret
4. ✅ Updated frontend to use worker
5. ✅ Tested everything

**Your API key is now safe!** 🔒

No one can extract it from your website because it never leaves the Cloudflare server.

---

## ❓ Need Help?

**Check these:**
- Cloudflare dashboard → Workers → Your worker → Logs
- Browser console (F12 or DevTools) for errors
- GitHub Actions tab to see if deployment succeeded

**Common fixes:**
- Worker not responding → Check it's deployed
- "Forbidden" error → Update `allowedOrigins` in worker
- "Server error" → Check API key secret is set
- Site not updated → Wait for GitHub Pages rebuild (2-3 min)

---

🎉 **You're all set!** Everything was done through web interfaces - no command line needed!
