# Two Truths & A Lie - Gamified Travel Guide

An interactive, AI-powered travel guide that presents destination information as a game: can you spot the lie among the truths?

## Features

### 🎮 Gamification
- Each travel category presents **3 items: 2 truths and 1 lie**
- Guess which is the lie to earn points
- Score tracking system (+10 for correct guesses, -5 for wrong ones)

### ✍️ Multiple Writing Styles
Choose from famous travel writers' perspectives:
- **Standard** - Clear, informative travel guide prose
- **Richard Francis Burton** - Victorian explorer with elaborate scholarly observations
- **Isabella Bird** - Vivid, personal narratives with rich sensory details
- **Ibn Battuta** - Focus on Islamic culture, trade routes, and social customs
- **Dorothy West** - Elegant, perceptive prose about social dynamics and culture
- **Hunter S. Thompson** - Gonzo journalism with wild imagery and dark humor

### 🗺️ Interactive Maps
- Powered by OpenStreetMap (free)
- Automatically plots the main location
- Displays all places mentioned in the guide
- Click on map markers to explore those locations

### 🔗 Dynamic Linking
- Place names in the text are automatically linked
- Click any location to generate a new guide for that place
- Build your own exploration path
- Breadcrumb navigation tracks your journey

### 🤖 LLM Integration via OpenRouter
- Supports multiple models (Claude, GPT-4, Llama, etc.)
- Switch models for different costs/quality
- Use cheaper models for casual browsing
- Use premium models for detailed exploration

### 📍 Adaptive Categories
Content categories adapt to location type:
- **Cities**: Introduction, Getting There, Where to Stay, Food & Drink, Top Sights, Activities, Day Trips, Practical Tips
- **Museums**: Introduction, History & Architecture, Must-See Exhibits, Hidden Gems, Special Collections, Visitor Information
- **Buildings/Monuments**: Introduction, History, Architecture & Design, Notable Features, Cultural Significance, Visiting
- **Natural Sites**: Introduction, Geography & Climate, Flora & Fauna, Activities, Best Times to Visit, Conservation

## Getting Started

### Prerequisites
1. An OpenRouter API key (get one at [openrouter.ai/keys](https://openrouter.ai/keys))
2. A modern web browser
3. Internet connection

### Setup
1. Open `travel-guide.html` in your browser
2. Click the "API Key" button in the header
3. Enter your OpenRouter API key
4. Start exploring!

### Usage
1. **Search for a destination**: Enter any city, landmark, museum, or place
2. **Choose your style**: Select a writing style from the dropdown
3. **Select a model**: Choose between quality and cost (cheaper models work fine!)
4. **Explore**: Click the "Explore" button
5. **Play the game**: For each category, guess which of the 3 items is false
6. **Click to reveal**: Press "Is this the lie?" to check your answer
7. **Follow links**: Click on any place name to explore it
8. **Track your journey**: Use breadcrumbs to navigate back

## Supported Models

### Anthropic
- `claude-3.5-sonnet` - Best quality, most expensive
- `claude-3-haiku` - Good quality, cheaper

### OpenAI
- `gpt-4-turbo` - High quality
- `gpt-3.5-turbo` - Fast and cheap

### Meta
- `llama-3.1-70b-instruct` - Open source, good quality

**Tip**: Start with cheaper models like GPT-3.5 Turbo or Claude Haiku for casual exploration. They work great for this use case!

## How It Works

### Content Generation
1. When you enter a location, the app asks the LLM to identify the location type
2. Based on the type, it selects appropriate categories
3. For each category, it generates 3 items (2 truths, 1 lie) in your selected writing style
4. The lie is randomly positioned (not always in the same spot)

### Place Linking
1. The app extracts capitalized phrases from the generated text
2. These are converted to clickable links
3. When clicked, a new page is generated for that location
4. The geocoding service finds coordinates for mapping

### Scoring
- **+10 points** for correctly identifying the lie
- **-5 points** for guessing wrong
- Score is saved in local storage

## Technical Architecture

### Frontend Stack
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS variables
- **Vanilla JavaScript** - No framework dependencies

### APIs Used
- **OpenRouter** - LLM access (paid, requires API key)
- **Nominatim (OpenStreetMap)** - Geocoding (free, no key required)
- **Leaflet** - Map library (free, no key required)

### Data Flow
```
User Input → LLM Prompt → OpenRouter API → Parse JSON Response →
Extract Places → Geocode → Render UI → Display Map
```

## Example Prompts

The app constructs prompts like this:

```
You are a travel guide writer. Write in the style of Hunter S. Thompson -
gonzo journalism with wild imagery, sharp cultural criticism, dark humor,
and surreal observations.

Create a travel guide for "Tokyo".

For each of the following categories, provide exactly 3 items - TWO TRUTHS
and ONE LIE (the lie should be plausible but false). Mix them randomly.

Categories: Introduction, Getting There, Where to Stay, Food & Drink,
Top Sights, Activities, Day Trips, Practical Tips

[Format instructions...]
```

## Cost Considerations

OpenRouter pricing varies by model:
- **GPT-3.5 Turbo**: ~$0.002 per request
- **Claude Haiku**: ~$0.005 per request
- **GPT-4 Turbo**: ~$0.02 per request
- **Claude Sonnet**: ~$0.03 per request

A typical location page uses 2 API calls (~4000 tokens total), so costs are minimal with cheaper models.

## Privacy & Data

- API key is stored in browser's localStorage only
- No data is sent to any server except OpenRouter
- No tracking or analytics
- Geocoding uses public OpenStreetMap data

## Limitations

- LLM responses can vary in quality
- Geocoding may fail for very obscure locations
- Rate limiting on free geocoding service (1 request/second)
- Some models may generate better "lies" than others
- Map markers only show successfully geocoded locations

## Tips for Best Results

1. **Be specific**: "The Louvre" works better than just "museum"
2. **Try different styles**: Hunter S. Thompson on "Las Vegas" is entertaining!
3. **Explore the links**: Let the app take you on a journey
4. **Use cheaper models**: They're often sufficient and save money
5. **Watch for plausible lies**: The best lies sound almost true

## Troubleshooting

**"Failed to generate content"**
- Check your API key is correct
- Ensure you have OpenRouter credits
- Try a different model

**"No map markers appear"**
- Geocoding may have failed
- Try a more well-known location
- Check browser console for errors

**"This is taking forever"**
- Larger models take longer
- Geocoding adds ~10 seconds for places with many mentions
- Check your internet connection

## Future Enhancements

Potential improvements:
- Difficulty levels (more subtle lies)
- Multiplayer mode
- Achievement system
- Saved journeys
- Export travel itineraries
- Offline mode with pre-generated content
- Image generation for locations
- Audio narration in different styles

## Credits

- **OpenStreetMap** - Map data and geocoding
- **Leaflet** - Interactive map library
- **OpenRouter** - LLM API aggregation

## License

This is a demo application for educational purposes. Use responsibly and respect API usage limits.

---

**Enjoy your journey through truth and fiction!** 🌍✈️🎯
