# Blog Post Composer

A web-based tool for composing blog posts with YAML headers and Markdown content, featuring AI-powered header generation.

## Features

- **Split-Panel Interface**: Edit on the left, preview on the right
- **AI Header Generation**: Automatically generate YAML headers using Claude, GPT-4, or other LLMs
- **Live Markdown Preview**: See your post rendered in real-time
- **Custom CSS Support**: Load your blog's CSS for accurate preview
- **Auto-Save Drafts**: Never lose your work with automatic local storage
- **Smart URL Handling**: Special formatting for History.com and Templeton.org links
- **Keyboard Shortcuts**:
  - `Ctrl/Cmd + S`: Download post
  - `Ctrl/Cmd + G`: Generate header

## Quick Start

1. Open `blog-composer.html` in your web browser
2. Click "⚙️ API Config" to set up your LLM provider and API key
3. Enter your blog post content in the Body section
4. Click "✨ Generate Header" to create the YAML header
5. Review the preview on the right
6. Click "💾 Download" to save your post

## Setup

### API Configuration

The composer supports three LLM providers:

#### Anthropic (Claude)
- Provider: `anthropic`
- Default Model: `claude-3-5-sonnet-20241022`
- Get API key: https://console.anthropic.com/

#### OpenAI
- Provider: `openai`
- Default Model: `gpt-4-turbo-preview`
- Get API key: https://platform.openai.com/api-keys

#### OpenRouter
- Provider: `openrouter`
- Default Model: `anthropic/claude-3.5-sonnet`
- Get API key: https://openrouter.ai/keys
- Supports multiple models from different providers

### Custom CSS

To preview your posts with your blog's actual styling:

1. Enter your blog's CSS URL in the preview panel header
2. Click "Load CSS"
3. Example: `https://natebarksdale.xyz/styles.css`

## Header Format

The AI generates headers in this format:

```yaml
---
author: Nate Barksdale
pubDatetime: 2025-01-15
modDatetime: 2025-01-15
title: Your Post Title
slug: your-post-title
featured: false
draft: false
description: A punchy one-sentence description
emoji: 🎯
tags:
  - 📚 Tag One
  - 🔬 Tag Two
  - 💡 Tag Three
haiku: |
  First line of haiku
  Second line continues here
  Third line concludes it
coordinates: [38.8833, -77.0167]
---
```

## Special URL Handling

The composer automatically formats certain URLs:

### History.com Articles

Input:
```
https://www.history.com/news/article-title
```

Expands to:
```
For History.com, I wrote about [topic]

>[First body paragraph]
>
>[Second body paragraph]

[Read more at History.com](https://www.history.com/news/article-title)
```

### Templeton.org Articles

Input:
```
https://www.templeton.org/news/article-title
```

Expands to:
```
For the John Templeton Foundation, I wrote about [topic]

>[First paragraph after "In our Study of the Day feature series,"]

[Read more at templeton.org](https://www.templeton.org/news/article-title)
```

## Tags

The AI selects tags from `Approved-Tag-List.txt`. You can:
- Edit this file to add/remove approved tags
- Each tag includes an emoji for visual identification
- Typically 3-5 tags per post

## Files

- `blog-composer.html` - Main application (single-file, no dependencies)
- `Approved-Tag-List.txt` - List of approved tags for blog posts
- `BLOG_COMPOSER_README.md` - This documentation

## Privacy & Security

- API keys are stored in browser localStorage (not sent anywhere except to your chosen LLM provider)
- Drafts are saved locally in your browser
- No data is sent to any server except the LLM API you configure
- Works completely offline except for LLM API calls and custom CSS loading

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Requires a modern browser with ES6 support

## Workflow Tips

1. **Start with the body**: Write your content first, then generate the header
2. **Use markdown headers**: If you include a `# Title` in your body, the AI will use it
3. **Review AI output**: Always check the generated header for accuracy
4. **Edit freely**: The header is editable - tweak tags, emoji, coordinates as needed
5. **Save often**: Use `Ctrl/Cmd + S` to download your work periodically

## Troubleshooting

### "Please configure your API key first"
- Click "⚙️ API Config" and enter your API key
- Make sure you've selected the correct provider

### "API request failed"
- Check your API key is valid
- Verify you have credits/quota with your LLM provider
- Check your internet connection

### Preview not rendering
- Make sure you have content in the Body section
- Try refreshing the page
- Check browser console for errors

### Custom CSS not loading
- Verify the CSS URL is correct and publicly accessible
- Check for CORS issues (the CSS must allow cross-origin requests)
- Some sites block external CSS loading

## Development

The composer is a single HTML file with embedded CSS and JavaScript:
- Uses Marked.js for Markdown parsing (loaded from CDN)
- Pure vanilla JavaScript (no framework dependencies)
- Responsive design works on desktop and tablet

## License

Feel free to modify and use for your own blog!

## Credits

Built for composing posts for natebarksdale.xyz blog.
