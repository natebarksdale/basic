// Two Truths & A Lie - Gamified Travel Guide
// Main Application Logic

// Default Free-Tier API Key (with $0 spend limit - free models only)
// Note: In production, this gets replaced via GitHub Actions from secrets
// For local dev, we use the hardcoded key with rate limits
const DEFAULT_API_KEY = '';

// Check if we have a valid API key (not a placeholder)
function getValidApiKey() {
    const stored = localStorage.getItem('openrouter_api_key');
    if (stored && stored.trim()) return stored;

    // Check if default key is still a placeholder or empty
    if (!DEFAULT_API_KEY ||
        DEFAULT_API_KEY.trim() === '' ||
        (DEFAULT_API_KEY.startsWith('__') && DEFAULT_API_KEY.endsWith('__'))) {
        return null; // No valid key available
    }

    return DEFAULT_API_KEY;
}

// Application State
const AppState = {
    apiKey: getValidApiKey(),
    currentLocation: null,
    currentModel: 'google/gemini-2.0-flash-exp:free',
    writingStyle: 'parker',
    score: parseInt(localStorage.getItem('travel_guide_score')) || 0,
    history: [],
    map: null,
    homeMap: null,
    homeMarker: null,
    bottomMap: null,
    bottomMarker: null,
    bottomMapCoords: { lat: 48.8566, lng: 2.3522 },
    selectedCoords: { lat: 48.8566, lng: 2.3522 }, // Default to Paris
    markers: [],
    isGenerating: false
};

// Writing Style Personas
const WRITING_STYLES = {
    parker: {
        name: "Dorothy Parker",
        prompt: "Write in the style of Dorothy Parker - razor-sharp wit, biting humor, and devastating one-liners. Use elegant yet caustic prose with sophisticated observations and perfectly timed sarcasm.",
        icon: "cocktail"
    },
    thompson: {
        name: "Hunter S. Thompson",
        prompt: "Write in the style of Hunter S. Thompson - gonzo journalism with wild imagery, sharp cultural criticism, dark humor, and surreal observations. Use punchy, irreverent prose with vivid metaphors.",
        icon: "sunglasses"
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
    wodehouse: {
        name: "P.G. Wodehouse",
        prompt: "Write in the style of P.G. Wodehouse - delightfully absurd, charming, and whimsical prose with impeccable comedic timing. Use elaborate metaphors, British wit, and cheerfully convoluted sentences.",
        icon: "tophat"
    },
    keys: {
        name: "A Man Who Lost His Keys",
        prompt: "Write in the style of a man desperately trying to remember where he left his keys - distracted, scattered thoughts that keep veering off topic. Obsessively mention checking pockets, retracing steps, and sudden false epiphanies about key locations. Frequently lose train of thought mid-sentence.",
        icon: "key"
    }
};

// Voice Icons (Emoji)
const VOICE_ICONS = {
    steamboat: '🚢',
    bird: '🦅',
    compass: '🧭',
    cocktail: '🍸',
    tophat: '🎩',
    key: '🔑',
    sunglasses: '🕶️',
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

// Diverse suggestion pools for dynamic generation
const SUGGESTION_POOLS = {
    cities: ['Paris', 'Tokyo', 'Rome', 'Barcelona', 'Istanbul', 'Cairo', 'Bangkok', 'Rio de Janeiro', 'Sydney', 'New York', 'London', 'Dubai', 'Singapore', 'Amsterdam', 'Prague'],
    landmarks: ['The Louvre', 'Machu Picchu', 'Taj Mahal', 'Colosseum', 'Eiffel Tower', 'Great Wall of China', 'Petra', 'Angkor Wat', 'Sagrada Familia', 'Stonehenge'],
    museums: ['British Museum', 'Metropolitan Museum of Art', 'Uffizi Gallery', 'Hermitage Museum', 'Prado Museum', 'Vatican Museums', 'Smithsonian'],
    nature: ['Grand Canyon', 'Mount Fuji', 'Santorini', 'Yosemite', 'Banff', 'Patagonia', 'Serengeti', 'Great Barrier Reef']
};

// Fetch relevant image from Wikipedia/Wikimedia
async function fetchWikipediaImage(query) {
    try {
        // First, search Wikipedia for the page
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&list=search&srsearch=${encodeURIComponent(query)}&srlimit=1`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            return null;
        }

        const pageTitle = searchData.query.search[0].title;

        // Get the page's main image
        const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&piprop=original&titles=${encodeURIComponent(pageTitle)}`;
        const imageResponse = await fetch(imageUrl);
        const imageData = await imageResponse.json();

        const pages = imageData.query.pages;
        const pageId = Object.keys(pages)[0];

        if (pages[pageId].original) {
            return pages[pageId].original.source;
        }

        return null;
    } catch (error) {
        console.error('Error fetching Wikipedia image:', error);
        return null;
    }
}

// Fallback to placeholder image
async function fetchPlaceholderImage(query) {
    const width = 1600;
    const height = 900;
    const seed = Math.abs(query.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
    return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

// Load hero image for a place
async function loadPlaceHeroImage(locationName) {
    const heroContainer = document.getElementById('placeHero');
    const heroImage = document.getElementById('placeHeroImage');

    // Try to get Wikipedia image first, fallback to placeholder
    let imageUrl = await fetchWikipediaImage(locationName);

    if (!imageUrl) {
        imageUrl = await fetchPlaceholderImage(locationName);
    }

    if (imageUrl) {
        // Add error handler to try fallback if image fails to load
        heroImage.onerror = async () => {
            // If Wikipedia image fails, try placeholder
            if (imageUrl.includes('wikipedia')) {
                const fallbackUrl = await fetchPlaceholderImage(locationName);
                if (fallbackUrl && fallbackUrl !== heroImage.src) {
                    heroImage.src = fallbackUrl;
                } else {
                    heroContainer.style.display = 'none';
                    heroImage.style.display = 'none';
                }
            } else {
                heroContainer.style.display = 'none';
                heroImage.style.display = 'none';
            }
        };

        // Add load handler to show hero when image loads successfully
        heroImage.onload = () => {
            heroImage.style.display = 'block';
            heroContainer.style.display = 'block';
        };

        heroImage.src = imageUrl;
        heroImage.alt = locationName;
    } else {
        // Hide hero if no image URL
        heroContainer.style.display = 'none';
    }
}

// Initialize home map with draggable marker
function initializeHomeMap() {
    // Create map centered on Paris (default) - zoomed way out for world view
    AppState.homeMap = L.map('homeMap').setView([AppState.selectedCoords.lat, AppState.selectedCoords.lng], 2);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(AppState.homeMap);

    // Add draggable marker
    AppState.homeMarker = L.marker([AppState.selectedCoords.lat, AppState.selectedCoords.lng], {
        draggable: true,
        icon: L.divIcon({
            className: 'custom-marker home-marker',
            html: '<div class="marker-pin-large"></div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        })
    }).addTo(AppState.homeMap);

    // Update coordinates when marker is dragged
    AppState.homeMarker.on('dragend', function(e) {
        const position = e.target.getLatLng();
        AppState.selectedCoords = { lat: position.lat, lng: position.lng };
    });

    // Click on map to move marker
    AppState.homeMap.on('click', function(e) {
        AppState.homeMarker.setLatLng(e.latlng);
        AppState.selectedCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
    });
}

// Initialize bottom map with draggable marker
function initializeBottomMap(lat, lng) {
    // Clear existing map if present
    if (AppState.bottomMap) {
        AppState.bottomMap.remove();
        AppState.bottomMap = null;
        AppState.bottomMarker = null;
    }

    // Update coordinates
    AppState.bottomMapCoords = { lat, lng };

    // Create map centered on place coordinates (zoomed out to show city level)
    AppState.bottomMap = L.map('bottomMap').setView([lat, lng], 9);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(AppState.bottomMap);

    // Add draggable marker
    AppState.bottomMarker = L.marker([lat, lng], {
        draggable: true,
        icon: L.divIcon({
            className: 'custom-marker home-marker',
            html: '<div class="marker-pin-large"></div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        })
    }).addTo(AppState.bottomMap);

    // Update coordinates when marker is dragged
    AppState.bottomMarker.on('dragend', function(e) {
        const position = e.target.getLatLng();
        AppState.bottomMapCoords = { lat: position.lat, lng: position.lng };
    });

    // Click on map to move marker
    AppState.bottomMap.on('click', function(e) {
        AppState.bottomMarker.setLatLng(e.latlng);
        AppState.bottomMapCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
    });
}

// Reverse geocode coordinates to get location name
async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            {
                headers: {
                    'User-Agent': 'TwoTruthsLieTravelGuide/1.0'
                }
            }
        );

        const data = await response.json();

        if (data && data.address) {
            // Try to get a meaningful location name
            const addr = data.address;
            const locationName = addr.city || addr.town || addr.village ||
                               addr.county || addr.state || addr.country ||
                               `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            return locationName;
        }

        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}

// Generate random suggestion chips
function generateSuggestionChips() {
    const container = document.getElementById('quickSuggestions');

    // Clear existing chips (except label)
    const label = container.querySelector('.suggestion-label');
    container.innerHTML = '';
    container.appendChild(label);

    // Pick 1 random city
    const city = SUGGESTION_POOLS.cities[Math.floor(Math.random() * SUGGESTION_POOLS.cities.length)];

    // Pick 1 random landmark
    const landmark = SUGGESTION_POOLS.landmarks[Math.floor(Math.random() * SUGGESTION_POOLS.landmarks.length)];

    // Pick 1 random museum or nature spot
    const extraPool = Math.random() > 0.5 ? SUGGESTION_POOLS.museums : SUGGESTION_POOLS.nature;
    const extra = extraPool[Math.floor(Math.random() * extraPool.length)];

    // Combine and create chips
    const suggestions = [city, landmark, extra];

    suggestions.forEach(location => {
        const chip = document.createElement('button');
        chip.className = 'suggestion-chip';
        chip.dataset.location = location;
        chip.textContent = location;
        chip.addEventListener('click', () => {
            document.getElementById('locationInput').value = location;
            handleExplore();
        });
        container.appendChild(chip);
    });
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Debug: Log API key state on initialization
    console.log('App initialized. API Key state:', {
        hasApiKey: !!AppState.apiKey,
        isUsingDefault: isUsingDefaultKey(),
        localStorageKey: !!localStorage.getItem('openrouter_api_key')
    });

    // Set up event listeners
    document.getElementById('exploreBtn').addEventListener('click', handleExplore);
    document.getElementById('exploreMapBtn').addEventListener('click', handleExploreMap);
    document.getElementById('exploreBottomMapBtn').addEventListener('click', handleExploreBottomMap);
    document.getElementById('nearMeBtn').addEventListener('click', handleNearMe);
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
    document.getElementById('resetApiKey').addEventListener('click', resetToDefaultKey);

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

    // Update API key status indicator
    updateApiKeyStatus();

    // Note: We don't load the API key into the password field here because browsers
    // often block programmatic password field population on page load for security.
    // Instead, we load it when the settings panel is opened (see toggleSettings())

    // Generate random suggestion chips and initialize home map
    generateSuggestionChips();
    initializeHomeMap();

    // Note: We always have a key now (default key), so don't auto-open settings

    // Check for hash on page load and navigate to that location
    if (window.location.hash) {
        const location = decodeURIComponent(window.location.hash.substring(1));
        if (location) {
            loadPlace(location, false);
        }
    }

    // Handle browser back/forward and hash changes
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.location) {
            loadPlace(e.state.location, false);
        } else if (window.location.hash) {
            const location = decodeURIComponent(window.location.hash.substring(1));
            if (location) {
                loadPlace(location, false);
            } else {
                showSearchSection();
            }
        } else {
            showSearchSection();
        }
    });

    // Handle hash changes (e.g., from manual URL edits)
    window.addEventListener('hashchange', (e) => {
        if (window.location.hash) {
            const location = decodeURIComponent(window.location.hash.substring(1));
            if (location) {
                loadPlace(location, false);
            }
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
    const toggleElement = document.getElementById('voiceToggle');
    const currentStyle = WRITING_STYLES[AppState.writingStyle];
    const iconKey = currentStyle.icon;

    if (VOICE_ICONS[iconKey]) {
        iconElement.textContent = VOICE_ICONS[iconKey];
    }

    // Update data-voice attribute for background color
    toggleElement.setAttribute('data-voice', AppState.writingStyle);
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

    // Update API key status and load key into input field when opening
    if (panel.classList.contains('open')) {
        const apiKeyInput = document.getElementById('apiKeyInput');
        // Always try to load the saved API key (if not using default)
        if (!isUsingDefaultKey() && AppState.apiKey) {
            apiKeyInput.value = AppState.apiKey;
            console.log('API key loaded into settings field');
        } else {
            console.log('Using default key or no custom key saved');
        }
        updateApiKeyStatus();
    }

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
    updateApiKeyStatus();

    // Close settings panel after short delay
    setTimeout(() => {
        closeSettings();
    }, 1000);
}

function resetToDefaultKey() {
    localStorage.removeItem('openrouter_api_key');
    AppState.apiKey = getValidApiKey();
    document.getElementById('apiKeyInput').value = '';

    if (AppState.apiKey) {
        showNotification('Reset to free-tier API key', 'success');
    } else {
        showNotification('No default API key available. Please enter your own OpenRouter API key.', 'error');
    }
    updateApiKeyStatus();
}

function isUsingDefaultKey() {
    // User is using default key if they haven't saved a custom one in localStorage
    return !localStorage.getItem('openrouter_api_key');
}

function updateApiKeyStatus() {
    const statusElement = document.getElementById('apiKeyStatus');
    if (statusElement) {
        if (!AppState.apiKey) {
            statusElement.innerHTML = '<span style="color: #f44336;">⚠ No API key set - please add your OpenRouter API key</span>';
        } else if (isUsingDefaultKey()) {
            statusElement.innerHTML = '<span style="color: #4CAF50;">✓ Using shared free-tier key (free models only)</span>';
        } else {
            statusElement.innerHTML = '<span style="color: #2196F3;">✓ Using your personal API key</span>';
        }
    }
}

// Handle Explore Map Location
async function handleExploreMap() {
    const locationName = await reverseGeocode(AppState.selectedCoords.lat, AppState.selectedCoords.lng);

    // Cancel any ongoing generation
    if (AppState.isGenerating) {
        AppState.isGenerating = false;
    }

    await loadPlace(locationName, true);
}

// Handle Explore Bottom Map Location
async function handleExploreBottomMap() {
    const locationName = await reverseGeocode(AppState.bottomMapCoords.lat, AppState.bottomMapCoords.lng);

    // Cancel any ongoing generation
    if (AppState.isGenerating) {
        AppState.isGenerating = false;
    }

    // Clear breadcrumb history for fresh exploration
    AppState.history = [];

    await loadPlace(locationName, true);
}

// Handle Near Me
async function handleNearMe() {
    if (!navigator.geolocation) {
        showNotification('Geolocation is not supported by your browser', 'error');
        return;
    }

    showNotification('Getting your location...', 'info');

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Update map marker
            AppState.homeMarker.setLatLng([lat, lng]);
            AppState.homeMap.setView([lat, lng], 12);
            AppState.selectedCoords = { lat, lng };

            const locationName = await reverseGeocode(lat, lng);
            showNotification(`Found: ${locationName}`, 'success');

            // Optionally auto-explore
            // await loadPlace(locationName, true);
        },
        (error) => {
            let message = 'Unable to get your location';
            if (error.code === error.PERMISSION_DENIED) {
                message = 'Location permission denied. Please enable location access.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                message = 'Location information unavailable';
            } else if (error.code === error.TIMEOUT) {
                message = 'Location request timed out';
            }
            showNotification(message, 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Handle Explore
async function handleExplore() {
    const location = document.getElementById('locationInput').value.trim();
    if (!location) {
        showNotification('Please enter a location', 'error');
        return;
    }

    // Check if we have a valid API key
    if (!AppState.apiKey) {
        showNotification('Please add your OpenRouter API key in settings', 'error');
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

    // Update loading text with current voice
    const voiceName = WRITING_STYLES[AppState.writingStyle].name;
    document.getElementById('loadingText').textContent = `Generating your travel guide in the style of ${voiceName}...`;

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

    // Load hero image for this place
    loadPlaceHeroImage(location);

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
        // Show helpful error message with actionable suggestions
        let errorMessage = error.message || 'Failed to generate content';

        // Add actionable suggestions based on error type
        if (errorMessage.includes('parse')) {
            errorMessage = 'Unable to generate content for this location. Try a different search term or tap the logo to start over.';
        } else if (errorMessage.includes('API')) {
            errorMessage += ' Please check your connection or try again.';
        } else {
            errorMessage += ' Pull down to reload or tap the logo to start over.';
        }

        showNotification(errorMessage, 'error');
        document.getElementById('loadingState').style.display = 'none';

        // Show a helpful message on the page
        document.getElementById('categoriesContainer').innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem; color: var(--color-text-light);">
                <p style="font-size: 1.125rem; margin-bottom: 1rem;">Unable to generate content</p>
                <p style="margin-bottom: 1.5rem;">Try searching for a different location or tap the logo to start over.</p>
                <button onclick="showSearchSection()" style="padding: 0.75rem 1.5rem; background: var(--color-accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem;">
                    Start Over
                </button>
            </div>
        `;
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

FEEDBACK: For each item, provide a SHORT contextual feedback message (1 sentence max) that reveals whether it's true or false. IMPORTANT: Write the feedback in the EXACT SAME VOICE AND STYLE as the main content. Be specific to the content, not generic. Match the tone, vocabulary, and personality of your chosen writing style.

Examples for different voices:
- Standard: "Indeed, this legendary café has been serving intellectuals since 1887."
- Mark Twain: "Ah, but this tale is true, friend - the café's been there longer than most governments!"
- Hunter S. Thompson: "Wrong, kid - that's pure fiction designed to separate tourists from their money."

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
        {"text": "Description with <strong>Place Name</strong> and <strong>important details</strong>.", "isLie": false, "feedback": "Contextual message in the SAME VOICE confirming this is true"},
        {"text": "Another with <strong>Notable Landmark</strong> and <strong>specific feature</strong>.", "isLie": true, "feedback": "Contextual message in the SAME VOICE revealing why this is false"},
        {"text": "Third mentioning <strong>Famous Restaurant</strong> and <strong>signature dish</strong>.", "isLie": false, "feedback": "Contextual message in the SAME VOICE about this truth"}
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

    // Show and initialize bottom map
    const bottomMapContainer = document.getElementById('bottomMapContainer');
    const exploreBottomMapBtn = document.getElementById('exploreBottomMapBtn');

    if (placeData.coordinates) {
        bottomMapContainer.style.display = 'block';
        exploreBottomMapBtn.style.display = 'flex';

        // Initialize map with place coordinates
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            initializeBottomMap(placeData.coordinates.lat, placeData.coordinates.lon);
        }, 100);
    } else {
        bottomMapContainer.style.display = 'none';
        exploreBottomMapBtn.style.display = 'none';
    }
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
        revealItem(itemEl, item);
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
function revealItem(itemEl, item) {
    if (itemEl.classList.contains('revealed')) return;

    itemEl.classList.add('revealed');

    const isLie = item.isLie;
    const baseFeedback = item.feedback || (isLie ? 'This was the lie!' : 'This is actually true.');

    let pointsMessage = '';
    let fullFeedback = '';

    if (isLie) {
        itemEl.classList.add('is-lie');
        updateScore(10);
        pointsMessage = 'Correct! +10';
        fullFeedback = `<div style="font-weight: 600; margin-bottom: 0.5rem;">${pointsMessage}</div><div>${baseFeedback}</div>`;
    } else {
        itemEl.classList.add('is-truth');
        updateScore(-5);
        pointsMessage = 'Wrong. -5';
        fullFeedback = `<div style="font-weight: 600; margin-bottom: 0.5rem;">${pointsMessage}</div><div>${baseFeedback}</div>`;
    }

    // Create and show overlay with feedback
    const overlay = document.createElement('div');
    overlay.className = `item-overlay ${isLie ? 'overlay-lie' : 'overlay-truth'}`;
    overlay.innerHTML = fullFeedback; // Use innerHTML to support <strong> tags
    itemEl.appendChild(overlay);

    // Trigger animation
    setTimeout(() => overlay.classList.add('show'), 10);

    // Add click handler to dismiss overlay
    overlay.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent tile click
        overlay.classList.remove('show');
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 300);
    });
}

// Update Score
function updateScore(delta) {
    const oldScore = AppState.score;
    AppState.score += delta;
    if (AppState.score < 0) AppState.score = 0;
    localStorage.setItem('travel_guide_score', AppState.score);
    updateScoreDisplay(delta, oldScore);
}

function updateScoreDisplay(delta = 0, oldScore = AppState.score) {
    // Animate the score ticker
    if (delta !== 0) {
        animateScoreTicker(oldScore, AppState.score, delta > 0);
    } else {
        document.getElementById('scoreValue').textContent = AppState.score;
    }

    // Update score color based on value
    const scoreValueElement = document.getElementById('scoreValue');
    let scoreColor;
    if (AppState.score < 0) {
        // Red for negative scores
        scoreColor = '#d96b5e';
    } else if (AppState.score === 0) {
        // Neutral gray for zero
        scoreColor = '#6b6b6b';
    } else {
        // Green for positive scores
        scoreColor = '#52a675';
    }
    scoreValueElement.style.color = scoreColor;

    // Update header score indicator
    const headerScore = document.getElementById('headerScore');
    const headerScoreValue = document.getElementById('headerScoreValue');

    if (AppState.score > 0) {
        headerScore.style.display = 'flex';

        // Add animation class based on delta
        if (delta > 0) {
            headerScore.classList.remove('score-decrease');
            headerScore.classList.add('score-increase');
            setTimeout(() => headerScore.classList.remove('score-increase'), 500);
        } else if (delta < 0) {
            headerScore.classList.remove('score-increase');
            headerScore.classList.add('score-decrease');
            setTimeout(() => headerScore.classList.remove('score-decrease'), 500);
        }

        // Animate header score
        if (delta !== 0) {
            animateHeaderScore(oldScore, AppState.score);
        } else {
            headerScoreValue.textContent = AppState.score;
        }
    } else {
        headerScore.style.display = 'none';
    }

    // Update title bar with score
    document.title = `(${AppState.score}) True/False Travel`;
}

// Animate score ticker
function animateScoreTicker(from, to, isIncrease) {
    const duration = 400;
    const steps = Math.abs(to - from);
    const stepDuration = duration / Math.max(steps, 1);
    let current = from;

    const interval = setInterval(() => {
        if (isIncrease) {
            current++;
            if (current >= to) {
                current = to;
                clearInterval(interval);
            }
        } else {
            current--;
            if (current <= to) {
                current = to;
                clearInterval(interval);
            }
        }
        document.getElementById('scoreValue').textContent = current;
    }, stepDuration);
}

// Animate header score
function animateHeaderScore(from, to) {
    const duration = 400;
    const steps = Math.abs(to - from);
    const stepDuration = duration / Math.max(steps, 1);
    let current = from;
    const isIncrease = to > from;

    const headerScoreValue = document.getElementById('headerScoreValue');
    const interval = setInterval(() => {
        if (isIncrease) {
            current++;
            if (current >= to) {
                current = to;
                clearInterval(interval);
            }
        } else {
            current--;
            if (current <= to) {
                current = to;
                clearInterval(interval);
            }
        }
        headerScoreValue.textContent = current;
    }, stepDuration);
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
    document.getElementById('searchSection').style.display = 'flex';
    document.getElementById('placeSection').style.display = 'none';
    AppState.history = [];
    history.pushState({}, '', '#');

    // Hide bottom map
    document.getElementById('bottomMapContainer').style.display = 'none';
    document.getElementById('exploreBottomMapBtn').style.display = 'none';

    // Regenerate suggestions on return to home
    generateSuggestionChips();

    // Re-initialize home map if it was cleared
    if (!AppState.homeMap) {
        initializeHomeMap();
    }
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
