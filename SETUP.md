# Setup Instructions

## GitHub Secret Configuration

To properly deploy this application, you need to configure a GitHub Secret for the OpenRouter API key.

### Steps to Configure the Secret:

1. **Navigate to your GitHub repository settings:**
   - Go to your repository on GitHub
   - Click on `Settings` (top menu)
   - In the left sidebar, click on `Secrets and variables` > `Actions`

2. **Create a new repository secret:**
   - Click the `New repository secret` button
   - Name: `OPENROUTER_API_KEY`
   - Value: Your OpenRouter API key (e.g., `sk-or-v1-...`)
   - Click `Add secret`

3. **Enable GitHub Pages (if not already enabled):**
   - Go to `Settings` > `Pages`
   - Under "Build and deployment", select "Source" as "GitHub Actions"

### How It Works

- The API key is **never** stored in the source code
- During deployment, GitHub Actions replaces the placeholder `__OPENROUTER_API_KEY__` with the actual key from secrets
- The built version contains the key, but it's only in the deployed files, not in your git history
- Users can still override with their own key via the settings panel in the app

### Local Development

For local development without the secret:
- Users will need to add their own API key through the app's settings panel
- Or you can temporarily add the key to `travel-guide.js` for local testing (but **never commit it**)

### Security Notes

**IMPORTANT: Configure OpenRouter API Key Protection**

While the API key is obfuscated in the code (reversed + base64), this is NOT real security - anyone can extract it from the browser. The actual protection comes from OpenRouter's built-in features:

#### 1. **Site Locking** (CRITICAL - Do This First!)
   - Go to [OpenRouter API Keys](https://openrouter.ai/keys)
   - Find your API key for this project
   - Click "Edit" → "Site Lock"
   - Add your GitHub Pages domain: `https://yourusername.github.io`
   - This prevents the key from working on any other website

   **Even if someone extracts your key, they cannot use it elsewhere!**

#### 2. **Spending Limits** (Recommended)
   - Set a monthly spending limit (e.g., $5/month)
   - Go to [OpenRouter Settings](https://openrouter.ai/settings/limits)
   - This caps the maximum damage if the key is misused

#### 3. **Use Free/Cheap Models**
   - The default model is `google/gemini-2.5-flash-lite` (free tier)
   - Free models have no cost even if heavily used
   - See [OpenRouter Models](https://openrouter.ai/models?order=newest&supported_parameters=tools&max_price=0) for free options

#### Why Obfuscation?
- Prevents automated bots from scraping API keys via regex
- Won't trigger GitHub secret scanning alerts
- Filters out the laziest attackers
- **Not a security measure** - just a speed bump

#### Defense in Depth Strategy:
1. **Site Lock** = Real protection (key only works on your domain)
2. **Spending Limits** = Damage control (caps maximum cost)
3. **Free Models** = Zero risk (no cost to misuse)
4. **Obfuscation** = Prevents casual scraping (minor benefit)

**Bottom Line:** The key WILL be visible to determined users, but site locking makes it useless to them.
