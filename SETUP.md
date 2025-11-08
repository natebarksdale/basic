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

- The API key used should have appropriate spending limits
- Consider using OpenRouter's free tier or a key with $0 spend limit for the default
- Users can always provide their own API key through the app interface
