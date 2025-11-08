// Two Truths & A Lie - Gamified Travel Guide
// Main Application Logic

// Application State
const AppState = {
    apiKey: localStorage.getItem('openrouter_api_key') || '',
    currentLocation: null,
    currentModel: 'google/gemini-2.5-flash-lite',
    writingStyle: 'standard',
    score: parseInt(localStorage.getItem('travel_guide_score')) || 0,
    history: [],
    map: null,
    markers: [],
    isGenerating: false
};

// Writing Style Personas
const WRITING_STYLES = {
    standard: {
        name: "Standard Travel Guide",
        prompt: "Write in a clear, informative travel guide style.",
        icon: "book"
    },
    twain: {
        name: "Mark Twain",
        prompt: "Write in the style of Mark Twain - witty, satirical observations with folksy wisdom and humorous exaggeration. Use colorful storytelling with sharp social commentary and a conversational tone.",
        icon: "steamboat"
    },
    bird: {
        name: "Isabella Bird",
        prompt: "Write in the style of Isabella Bird - vivid, detailed, personal observations with a focus on daily life, natural beauty, and the human experience. Use engaging first-person narrative with rich sensory details.",
        icon: "bird"
    },
    battuta: {
        name: "Ibn Battuta",
        prompt: "Write in the style of Ibn Battuta - focus on Islamic culture, trade routes, scholarly encounters, and the hospitality of rulers. Include observations about religious practices and social customs with reverence and wonder.",
        icon: "compass"
    },
    west: {
        name: "Dorothy West",
        prompt: "Write in the style of Dorothy West - elegant, perceptive prose focusing on social dynamics, class, culture, and the subtle nuances of place. Use sophisticated, literary language with keen social observation.",
        icon: "pen"
    },
    thompson: {
        name: "Hunter S. Thompson",
        prompt: "Write in the style of Hunter S. Thompson - gonzo journalism with wild imagery, sharp cultural criticism, dark humor, and surreal observations. Use punchy, irreverent prose with vivid metaphors.",
        icon: "sunglasses"
    }
};

// Voice Icons (Emoji)
const VOICE_ICONS = {
    book: '📖',
    steamboat: '🚢',
    bird: '🦅',
    compass: '🧭',
    pen: '✍️',
    sunglasses: '🕶️',
};

// Voice-Specific Notification Messages
const VOICE_MESSAGES = {
    standard: {
        correctLie: "Correct! This was the lie. +10 points",
        wrongTruth: "Wrong! This is actually true. -5 points"
    },
    twain: {
        correctLie: "Well spotted, friend! That was the bald-faced lie. +10 points",
        wrongTruth: "Ah, you've been bamboozled! This tale happens to be true. -5 points"
    },
    bird: {
        correctLie: "Your keen eye has caught the fabrication! Most delightful. +10 points",
        wrongTruth: "I'm afraid my dear reader, this observation is quite authentic. -5 points"
    },
    battuta: {
        correctLie: "Praise be! You have unveiled the falsehood. +10 points",
        wrongTruth: "Alas, this account is true as witnessed by this humble traveler. -5 points"
    },
    west: {
        correctLie: "How perceptive! You've discerned the fiction from fact. +10 points",
        wrongTruth: "I must correct you—this detail is, regrettably, quite true. -5 points"
    },
    thompson: {
        correctLie: "Hot damn! You nailed the lie. Fear and loathing avoided. +10 points",
        wrongTruth: "Wrong! That's the ugly truth, baby. Reality bites harder. -5 points"
    }
};

// Category Templates by Location Type
const CATEGORY_TEMPLATES = {
    city: ['Introduction', 'Where to Go', 'What to Eat', 'What to Do', 'Where to Stay', 'Getting Around', 'Day Trips', 'Practical Tips'],
    museum: ['Introduction', 'History & Architecture', 'Must-See Exhibits', 'Hidden Gems', 'Special Collections', 'Visitor Information'],
    building: ['Introduction', 'History', 'Architecture & Design', 'Notable Features', 'Cultural Significance', 'Visiting'],
    monument: ['Introduction', 'Historical Context', 'Design & Construction', 'Cultural Impact', 'Visiting Information'],
    nature: ['Introduction', 'Geography & Climate', 'Flora & Fauna', 'What to Do', 'Best Times to Visit', 'Conservation'],
    restaurant: ['Introduction', 'Signature Dishes', 'Atmosphere', 'History', 'Practical Information'],
    default: ['Introduction', 'Background', 'Where to Go', 'What to Eat', 'What to Do', 'Practical Information']
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Set up event listeners
    document.getElementById('exploreBtn').addEventListener('click', handleExplore);
    document.getElementById('locationInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleExplore();
    });
    document.getElementById('backBtn').addEventListener('click', showSearchSection);

    // Logo home click
    document.getElementById('logoHome').addEventListener('click', showSearchSection);

    // Voice toggle
    document.getElementById('voiceToggle').addEventListener('click', toggleVoiceMenu);

    // Voice menu
    document.getElementById('closeVoiceMenu').addEventListener('click', closeVoiceMenu);
    document.querySelectorAll('.voice-option').forEach(option => {
        option.addEventListener('click', () => {
            const voice = option.dataset.voice;
            selectVoice(voice);
        });
    });

    // Settings panel
    document.getElementById('menuToggle').addEventListener('click', toggleSettings);
    document.getElementById('closeSettings').addEventListener('click', closeSettings);
    document.getElementById('saveApiKey').addEventListener('click', saveApiKey);

    document.getElementById('modelSelect').addEventListener('change', (e) => {
        AppState.currentModel = e.target.value;
        // Refresh current page if viewing one
        if (AppState.currentLocation) {
            regenerateCurrentPage();
        }
    });

    // Suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.getElementById('locationInput').value = chip.dataset.location;
            handleExplore();
        });
    });

    // Update score display and load API key
    updateScoreDisplay();

    // Initialize voice icon
    updateVoiceIcon();

    // Load existing API key into input field
    const apiKeyInput = document.getElementById('apiKeyInput');
    if (AppState.apiKey) {
        apiKeyInput.value = AppState.apiKey;
        // Don't open settings if we have a key
    } else {
        // Open settings if no API key after a short delay
        setTimeout(() => {
            const panel = document.getElementById('settingsPanel');
            const toggle = document.getElementById('menuToggle');
            panel.style.display = 'block';
            setTimeout(() => {
                panel.classList.add('open');
                toggle.classList.add('active');
            }, 10);
        }, 500);
    }

    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.location) {
            loadPlace(e.state.location, false);
        } else {
            showSearchSection();
        }
    });

    // Handle pull-to-refresh
    let touchStartY = 0;
    document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        const touchY = e.touches[0].clientY;
        const touchDiff = touchY - touchStartY;

        // If we're at the top of the page and pulling down
        if (window.scrollY === 0 && touchDiff > 0 && AppState.currentLocation) {
            // This will trigger a page refresh which we want to intercept
        }
    }, { passive: true });
}

// Regenerate Current Page
function regenerateCurrentPage() {
    if (!AppState.currentLocation) return;

    // Get the current location name from history (last item)
    const currentLocationName = AppState.history[AppState.history.length - 1];

    // Remove the last item from history temporarily
    AppState.history.pop();

    // Reload the page
    loadPlace(currentLocationName, true);

    // Close settings panel
    closeSettings();
}

// Voice Menu Functions
function toggleVoiceMenu() {
    const panel = document.getElementById('voiceMenuPanel');
    const settingsPanel = document.getElementById('settingsPanel');

    // Close settings if open
    if (settingsPanel.classList.contains('open')) {
        closeSettings();
        setTimeout(() => {
            openVoiceMenu();
        }, 200);
    } else {
        if (panel.style.display === 'none') {
            openVoiceMenu();
        } else {
            closeVoiceMenu();
        }
    }
}

function openVoiceMenu() {
    const panel = document.getElementById('voiceMenuPanel');
    panel.style.display = 'block';
    panel.offsetHeight; // Force reflow
    panel.classList.add('open');

    // Update active voice option
    updateActiveVoiceOption();
}

function closeVoiceMenu() {
    const panel = document.getElementById('voiceMenuPanel');
    panel.classList.remove('open');

    setTimeout(() => {
        panel.style.display = 'none';
    }, 200);
}

function selectVoice(voice) {
    AppState.writingStyle = voice;

    // Update icon
    updateVoiceIcon();

    // Update active state
    updateActiveVoiceOption();

    // Show notification
    const styleName = WRITING_STYLES[voice].name;
    showNotification(`Writing style: ${styleName}`, 'info');

    // Refresh current page if viewing one
    if (AppState.currentLocation) {
        regenerateCurrentPage();
    }

    // Close menu
    closeVoiceMenu();
}

function updateActiveVoiceOption() {
    document.querySelectorAll('.voice-option').forEach(option => {
        if (option.dataset.voice === AppState.writingStyle) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

function updateVoiceIcon() {
    const iconElement = document.getElementById('voiceIcon');
    const currentStyle = WRITING_STYLES[AppState.writingStyle];
    const iconKey = currentStyle.icon;

    if (VOICE_ICONS[iconKey]) {
        iconElement.textContent = VOICE_ICONS[iconKey];
    }
}

// Settings Panel Management
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    const toggle = document.getElementById('menuToggle');

    // Show panel if hidden
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        // Force reflow before adding class
        panel.offsetHeight;
    }

    panel.classList.toggle('open');
    toggle.classList.toggle('active');

    // Hide panel after animation if closing
    if (!panel.classList.contains('open')) {
        setTimeout(() => {
            panel.style.display = 'none';
        }, 200);
    }
}

function closeSettings() {
    const panel = document.getElementById('settingsPanel');
    const toggle = document.getElementById('menuToggle');
    panel.classList.remove('open');
    toggle.classList.remove('active');

    // Hide panel after animation
    setTimeout(() => {
        panel.style.display = 'none';
    }, 200);
}

function saveApiKey() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    if (!apiKey) {
        showNotification('Please enter a valid API key', 'error');
        return;
    }

    // Save to both AppState and localStorage
    AppState.apiKey = apiKey;
    localStorage.setItem('openrouter_api_key', apiKey);

    showNotification('API key saved!', 'success');

    // Close settings panel after short delay
    setTimeout(() => {
        closeSettings();
    }, 1000);
}

// Handle Explore
async function handleExplore() {
    const location = document.getElementById('locationInput').value.trim();
    if (!location) {
        showNotification('Please enter a location', 'error');
        return;
    }

    if (!AppState.apiKey) {
        showNotification('Please add your API key in settings', 'error');
        toggleSettings();
        return;
    }

    // Cancel any ongoing generation
    if (AppState.isGenerating) {
        AppState.isGenerating = false;
    }

    await loadPlace(location, true);
}

// Strip parenthetical content from location name
function stripParenthetical(locationName) {
    // Remove everything from the first opening parenthesis onwards
    const index = locationName.indexOf('(');
    if (index !== -1) {
        return locationName.substring(0, index).trim();
    }
    return locationName;
}

// Load Place
async function loadPlace(location, addToHistory = true) {
    AppState.isGenerating = true;

    // Show place section and update UI immediately
    document.getElementById('searchSection').style.display = 'none';
    document.getElementById('placeSection').style.display = 'block';
    document.getElementById('loadingState').style.display = 'flex';
    document.getElementById('categoriesContainer').innerHTML = '';

    // Update header immediately with the new location
    document.getElementById('placeName').textContent = location;
    document.getElementById('placeType').textContent = 'Loading...';

    // Update history and breadcrumb immediately
    if (addToHistory) {
        // Strip parenthetical content before adding to history to avoid nested parentheses
        const cleanLocationName = stripParenthetical(location);
        AppState.history.push(cleanLocationName);
        history.pushState({ location: cleanLocationName }, '', `#${encodeURIComponent(cleanLocationName)}`);
    }
    updateBreadcrumb();

    try {
        // Generate content
        const placeData = await generatePlaceContent(location);

        // Check if still generating (not cancelled)
        if (!AppState.isGenerating) {
            return;
        }

        // Display content
        displayPlaceContent(placeData);

        // Initialize map
        initializeMap(placeData);

        document.getElementById('loadingState').style.display = 'none';
    } catch (error) {
        console.error('Error loading place:', error);
        // Show the actual error message instead of generic one
        const errorMessage = error.message || 'Failed to generate content. Please try again.';
        showNotification(errorMessage, 'error');
        document.getElementById('loadingState').style.display = 'none';
    } finally {
        AppState.isGenerating = false;
    }
}

// Generate Place Content using LLM
async function generatePlaceContent(location) {
    const writingStyle = WRITING_STYLES[AppState.writingStyle];

    // Determine location type - use a simpler heuristic to save an API call
    let locationType = 'default';
    const lowerLocation = location.toLowerCase();
    if (lowerLocation.includes('museum')) locationType = 'museum';
    else if (lowerLocation.includes('cathedral') || lowerLocation.includes('tower') ||
             lowerLocation.includes('palace') || lowerLocation.includes('castle')) locationType = 'building';
    else if (lowerLocation.includes('monument') || lowerLocation.includes('statue') ||
             lowerLocation.includes('memorial')) locationType = 'monument';
    else if (lowerLocation.includes('park') || lowerLocation.includes('beach') ||
             lowerLocation.includes('mountain') || lowerLocation.includes('forest')) locationType = 'nature';
    else if (lowerLocation.includes('restaurant') || lowerLocation.includes('cafe') ||
             lowerLocation.includes('bar')) locationType = 'restaurant';
    else if (location.split(' ').length <= 2 && !lowerLocation.includes('the')) locationType = 'city';

    const categories = CATEGORY_TEMPLATES[locationType] || CATEGORY_TEMPLATES.default;

    // Generate content - optimized prompt for speed
    const prompt = `Travel guide for "${location}". ${writingStyle.prompt}

For each category below, write 3 items (2-3 sentences each): TWO TRUE facts and ONE PLAUSIBLE LIE. Mix randomly.

CRITICAL: Format text like a travel guide by wrapping important place names, landmarks, neighborhoods, restaurants, museums, and key nouns/phrases in <strong> tags. These should be words that would typically be boldfaced in a travel guide.

REQUIREMENT: EVERY item MUST have AT LEAST 2 strong-tagged phrases. Do not skip this - it's essential for navigation.

Examples:
- "Visit <strong>Café de Flore</strong> in the heart of <strong>Saint-Germain-des-Prés</strong> for authentic Parisian atmosphere."
- "The <strong>Louvre Museum</strong> houses over 35,000 works of art across <strong>eight curatorial departments</strong>."
- "Head to <strong>Le Marais</strong> for vintage shopping at <strong>Free'P'Star</strong> and grab dinner at <strong>L'As du Fallafel</strong>."

Categories: ${categories.join(', ')}

Return ONLY valid JSON:
{
  "name": "${location}",
  "type": "${locationType}",
  "coordinates": {"lat": <number>, "lon": <number>},
  "categories": [
    {
      "name": "Category Name",
      "items": [
        {"text": "Description with <strong>Place Name</strong> and <strong>important details</strong>.", "isLie": false},
        {"text": "Another with <strong>Notable Landmark</strong> and <strong>specific feature</strong>.", "isLie": true},
        {"text": "Third mentioning <strong>Famous Restaurant</strong> and <strong>signature dish</strong>.", "isLie": false}
      ]
    }
  ]
}`;

    const response = await callLLM(prompt, 3000);

    // Parse JSON response
    let placeData;
    try {
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            placeData = JSON.parse(jsonMatch[0]);
        } else {
            throw new Error('No JSON found in response');
        }
    } catch (error) {
        console.error('Failed to parse JSON:', error);
        throw new Error('Failed to parse location data');
    }

    // Skip geocoding for speed - just return the data
    placeData.mentionedPlaces = [];

    return placeData;
}

// Call OpenRouter LLM
async function callLLM(prompt, maxTokens = 2000) {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AppState.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Two Truths & A Lie Travel Guide'
            },
            body: JSON.stringify({
                model: AppState.currentModel,
                messages: [
                    { role: 'user', content: prompt }
                ],
                max_tokens: maxTokens
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            const errorMessage = errorData.error?.message || errorData.error || 'API request failed';
            throw new Error(`API Error (${response.status}): ${errorMessage}`);
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response format from API');
        }

        return data.choices[0].message.content;
    } catch (error) {
        console.error('LLM API Error:', error);
        if (error.message.includes('401') || error.message.includes('403')) {
            throw new Error('Invalid API key. Please check your OpenRouter API key in settings.');
        } else if (error.message.includes('429')) {
            throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (error.message.includes('insufficient')) {
            throw new Error('Insufficient credits on your OpenRouter account.');
        }
        throw error;
    }
}

// Extract place names from content and geocode them
async function extractAndGeocodePlaces(placeData) {
    const mentionedPlaces = new Set();

    // Extract potential place names - be more strict
    placeData.categories.forEach(category => {
        category.items.forEach(item => {
            // Look for proper nouns - at least 2 words or well-known single places
            // Match patterns like "Central Park", "Eiffel Tower", etc.
            const matches = item.text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g);
            if (matches) {
                matches.forEach(match => {
                    // Filter out common phrases and short matches
                    const words = match.split(' ');
                    const firstWord = words[0];

                    // Skip if starts with common words or is too generic
                    if (['The', 'A', 'An', 'In', 'On', 'At', 'For', 'To', 'From', 'This', 'That',
                         'These', 'Those', 'It', 'Its', 'Many', 'Most', 'Some'].includes(firstWord)) {
                        return;
                    }

                    // Only include if it looks like a real place name (has keywords or is 2+ words)
                    if (words.length >= 2 || match.match(/(Museum|Park|Palace|Tower|Cathedral|Castle|Temple|Square|Street|Avenue|Beach|Mountain|River|Lake)/)) {
                        mentionedPlaces.add(match);
                    }
                });
            }
        });
    });

    // Geocode places in parallel - limit to 5 most likely places
    const placesArray = Array.from(mentionedPlaces).slice(0, 5);

    // Geocode in parallel for speed
    const geocodePromises = placesArray.map(async place => {
        try {
            await new Promise(resolve => setTimeout(resolve, 200)); // Stagger requests
            const coords = await geocodePlace(place);
            if (coords) {
                return { name: place, ...coords };
            }
        } catch (error) {
            console.error(`Failed to geocode ${place}:`, error);
        }
        return null;
    });

    const results = await Promise.all(geocodePromises);
    return results.filter(r => r !== null);
}

// Geocode a place name using Nominatim
async function geocodePlace(placeName) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName)}&format=json&limit=1`,
            {
                headers: {
                    'User-Agent': 'TwoTruthsLieTravelGuide/1.0'
                }
            }
        );

        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
        }
    } catch (error) {
        console.error('Geocoding error:', error);
    }
    return null;
}

// Display Place Content
function displayPlaceContent(placeData) {
    AppState.currentLocation = placeData;

    // Update header
    document.getElementById('placeName').textContent = placeData.name;
    document.getElementById('placeType').textContent = placeData.type || 'Location';

    // Create categories
    const container = document.getElementById('categoriesContainer');
    container.innerHTML = '';

    placeData.categories.forEach((category, categoryIndex) => {
        const categoryEl = createCategoryElement(category, categoryIndex);
        container.appendChild(categoryEl);
    });
}

// Create Category Element
function createCategoryElement(category, categoryIndex) {
    const section = document.createElement('div');
    section.className = 'category';

    const header = document.createElement('h2');
    header.className = 'category-title';
    header.textContent = category.name;
    section.appendChild(header);

    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'items-container';

    category.items.forEach((item, itemIndex) => {
        const itemEl = createItemElement(item, categoryIndex, itemIndex);
        itemsContainer.appendChild(itemEl);
    });

    section.appendChild(itemsContainer);
    return section;
}

// Create Item Element
function createItemElement(item, categoryIndex, itemIndex) {
    const itemEl = document.createElement('div');
    itemEl.className = 'item';
    itemEl.dataset.categoryIndex = categoryIndex;
    itemEl.dataset.itemIndex = itemIndex;
    itemEl.dataset.isLie = item.isLie;

    // Convert place names to links
    const textWithLinks = convertPlaceNamesToLinks(item.text);

    const textEl = document.createElement('div');
    textEl.className = 'item-text';
    textEl.innerHTML = textWithLinks;

    itemEl.appendChild(textEl);

    // Make entire item clickable
    itemEl.addEventListener('click', (e) => {
        // Don't reveal if clicking on a place link
        if (e.target.classList.contains('place-link')) {
            return;
        }
        revealItem(itemEl, item.isLie);
    });

    return itemEl;
}

// Convert place names to clickable links
// Handles both <strong> tags and markdown **bold** syntax
function convertPlaceNamesToLinks(text) {
    // First, convert markdown **bold** to <strong> tags
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Then convert <strong>text</strong> to <strong><a href="..." class="place-link">text</a></strong>
    return text.replace(/<strong>(.*?)<\/strong>/g, (match, content) => {
        // Escape single quotes in content for onclick handler
        const escapedContent = content.replace(/'/g, "\\'");
        return `<strong><a href="#" class="place-link" onclick="handlePlaceLink(event, '${escapedContent}')">${content}</a></strong>`;
    });
}

// Handle place link clicks
function handlePlaceLink(event, placeName) {
    event.preventDefault();

    // Build contextual place name with breadcrumbs (last 3 only)
    let contextualName = placeName;
    if (AppState.history.length > 0) {
        // Add context from last 3 breadcrumbs in reverse order
        // e.g., "President Hotel (Asunción, Paraguay, South America)"
        const lastThree = AppState.history.slice(-3).reverse();
        const breadcrumbContext = lastThree.join(', ');
        contextualName = `${placeName} (${breadcrumbContext})`;
    }

    loadPlace(contextualName, true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Reveal if item is truth or lie
function revealItem(itemEl, isLie) {
    if (itemEl.classList.contains('revealed')) return;

    itemEl.classList.add('revealed');

    // Get voice-specific messages
    const messages = VOICE_MESSAGES[AppState.writingStyle] || VOICE_MESSAGES.standard;

    if (isLie) {
        itemEl.classList.add('is-lie');
        updateScore(10);
        showNotification(messages.correctLie, 'success');
    } else {
        itemEl.classList.add('is-truth');
        updateScore(-5);
        showNotification(messages.wrongTruth, 'error');
    }
}

// Update Score
function updateScore(delta) {
    AppState.score += delta;
    if (AppState.score < 0) AppState.score = 0;
    localStorage.setItem('travel_guide_score', AppState.score);
    updateScoreDisplay();
}

function updateScoreDisplay() {
    document.getElementById('scoreValue').textContent = AppState.score;
    // Update title bar with score
    document.title = `(${AppState.score}) Two Truths & A Lie`;
}

// Initialize Map
function initializeMap(placeData) {
    // Clear existing map
    if (AppState.map) {
        AppState.map.remove();
    }

    // Create map centered on main location with appropriate zoom
    const coords = placeData.coordinates || { lat: 0, lon: 0 };

    // Determine zoom based on location type
    let zoom = 13;
    if (placeData.type === 'city') zoom = 11;
    else if (placeData.type === 'nature') zoom = 10;
    else if (placeData.type === 'building' || placeData.type === 'monument') zoom = 16;

    AppState.map = L.map('map').setView([coords.lat, coords.lon], zoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(AppState.map);

    // Add main location marker
    const mainMarker = L.marker([coords.lat, coords.lon], {
        icon: L.divIcon({
            className: 'custom-marker main-marker',
            html: '<div class="marker-pin"></div>',
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        })
    }).addTo(AppState.map);

    mainMarker.bindPopup(`<strong>${placeData.name}</strong>`);

    // Add markers for mentioned places (but keep focus on main location)
    if (placeData.mentionedPlaces && placeData.mentionedPlaces.length > 0) {
        placeData.mentionedPlaces.forEach(place => {
            const marker = L.marker([place.lat, place.lon], {
                icon: L.divIcon({
                    className: 'custom-marker mentioned-marker',
                    html: '<div class="marker-pin-small"></div>',
                    iconSize: [20, 28],
                    iconAnchor: [10, 28]
                })
            }).addTo(AppState.map);

            marker.bindPopup(`<a href="#" onclick="handlePlaceLink(event, '${place.name}')">${place.name}</a>`);
        });
    }

    // Keep map centered on main location
    // Don't use fitBounds - just stay focused on the primary location
}

// Update Breadcrumb
function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    breadcrumb.innerHTML = AppState.history.map((location, index) => {
        if (index === AppState.history.length - 1) {
            return `<span class="breadcrumb-current">${location}</span>`;
        }
        return `<a href="#" class="breadcrumb-link" onclick="navigateToBreadcrumb(${index})">${location}</a>`;
    }).join(' <span class="breadcrumb-separator">›</span> ');
}

function navigateToBreadcrumb(index) {
    event.preventDefault();
    const location = AppState.history[index];
    AppState.history = AppState.history.slice(0, index);
    loadPlace(location, true);
}

// Show Search Section
function showSearchSection() {
    document.getElementById('searchSection').style.display = 'block';
    document.getElementById('placeSection').style.display = 'none';
    AppState.history = [];
    history.pushState({}, '', '#');
}

// Show Notification
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Make functions globally available
window.handlePlaceLink = handlePlaceLink;
window.navigateToBreadcrumb = navigateToBreadcrumb;
