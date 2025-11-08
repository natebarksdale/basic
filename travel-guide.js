// Two Truths & A Lie - Gamified Travel Guide
// Main Application Logic

// Application State
const AppState = {
    apiKey: localStorage.getItem('openrouter_api_key') || '',
    currentLocation: null,
    currentModel: 'anthropic/claude-3.5-sonnet',
    writingStyle: 'standard',
    score: parseInt(localStorage.getItem('travel_guide_score')) || 0,
    history: [],
    map: null,
    markers: []
};

// Writing Style Personas
const WRITING_STYLES = {
    standard: {
        name: "Standard Travel Guide",
        prompt: "Write in a clear, informative travel guide style."
    },
    burton: {
        name: "Richard Francis Burton",
        prompt: "Write in the style of Victorian explorer Richard Francis Burton - erudite, adventurous, with detailed observations of customs, languages, and cultural practices. Use elaborate Victorian prose with scholarly references."
    },
    bird: {
        name: "Isabella Bird",
        prompt: "Write in the style of Isabella Bird - vivid, detailed, personal observations with a focus on daily life, natural beauty, and the human experience. Use engaging first-person narrative with rich sensory details."
    },
    battuta: {
        name: "Ibn Battuta",
        prompt: "Write in the style of Ibn Battuta - focus on Islamic culture, trade routes, scholarly encounters, and the hospitality of rulers. Include observations about religious practices and social customs with reverence and wonder."
    },
    west: {
        name: "Dorothy West",
        prompt: "Write in the style of Dorothy West - elegant, perceptive prose focusing on social dynamics, class, culture, and the subtle nuances of place. Use sophisticated, literary language with keen social observation."
    },
    thompson: {
        name: "Hunter S. Thompson",
        prompt: "Write in the style of Hunter S. Thompson - gonzo journalism with wild imagery, sharp cultural criticism, dark humor, and surreal observations. Use punchy, irreverent prose with vivid metaphors."
    }
};

// Category Templates by Location Type
const CATEGORY_TEMPLATES = {
    city: ['Introduction', 'Getting There', 'Where to Stay', 'Food & Drink', 'Top Sights', 'Activities', 'Day Trips', 'Practical Tips'],
    museum: ['Introduction', 'History & Architecture', 'Must-See Exhibits', 'Hidden Gems', 'Special Collections', 'Visitor Information'],
    building: ['Introduction', 'History', 'Architecture & Design', 'Notable Features', 'Cultural Significance', 'Visiting'],
    monument: ['Introduction', 'Historical Context', 'Design & Construction', 'Cultural Impact', 'Visiting Information'],
    nature: ['Introduction', 'Geography & Climate', 'Flora & Fauna', 'Activities', 'Best Times to Visit', 'Conservation'],
    restaurant: ['Introduction', 'Signature Dishes', 'Atmosphere', 'History', 'Practical Information'],
    default: ['Introduction', 'Background', 'Key Features', 'Experience', 'Practical Information']
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
    document.getElementById('apiKeyBtn').addEventListener('click', openApiKeyModal);
    document.getElementById('writingStyle').addEventListener('change', (e) => {
        AppState.writingStyle = e.target.value;
    });
    document.getElementById('modelSelect').addEventListener('change', (e) => {
        AppState.currentModel = e.target.value;
    });

    // Suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.getElementById('locationInput').value = chip.dataset.location;
            handleExplore();
        });
    });

    // Update score display
    updateScoreDisplay();

    // Check for API key
    if (!AppState.apiKey) {
        setTimeout(() => openApiKeyModal(), 1000);
    }

    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.location) {
            loadPlace(e.state.location, false);
        } else {
            showSearchSection();
        }
    });
}

// API Key Management
function openApiKeyModal() {
    document.getElementById('apiKeyModal').style.display = 'flex';
    document.getElementById('apiKeyInput').value = AppState.apiKey;
}

function closeApiKeyModal() {
    document.getElementById('apiKeyModal').style.display = 'none';
}

function saveApiKey() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    if (!apiKey) {
        showNotification('Please enter a valid API key', 'error');
        return;
    }
    AppState.apiKey = apiKey;
    localStorage.setItem('openrouter_api_key', apiKey);
    closeApiKeyModal();
    showNotification('API key saved successfully!', 'success');
}

// Handle Explore
async function handleExplore() {
    const location = document.getElementById('locationInput').value.trim();
    if (!location) {
        showNotification('Please enter a location', 'error');
        return;
    }

    if (!AppState.apiKey) {
        openApiKeyModal();
        return;
    }

    await loadPlace(location, true);
}

// Load Place
async function loadPlace(location, addToHistory = true) {
    // Show place section
    document.getElementById('searchSection').style.display = 'none';
    document.getElementById('placeSection').style.display = 'block';
    document.getElementById('loadingState').style.display = 'flex';
    document.getElementById('categoriesContainer').innerHTML = '';

    // Update history
    if (addToHistory) {
        AppState.history.push(location);
        history.pushState({ location }, '', `#${encodeURIComponent(location)}`);
    }

    // Update breadcrumb
    updateBreadcrumb();

    try {
        // Generate content
        const placeData = await generatePlaceContent(location);

        // Display content
        displayPlaceContent(placeData);

        // Initialize map
        initializeMap(placeData);

        document.getElementById('loadingState').style.display = 'none';
    } catch (error) {
        console.error('Error loading place:', error);
        showNotification('Failed to generate content. Please check your API key and try again.', 'error');
        document.getElementById('loadingState').style.display = 'none';
    }
}

// Generate Place Content using LLM
async function generatePlaceContent(location) {
    const writingStyle = WRITING_STYLES[AppState.writingStyle];

    // First, determine the location type and appropriate categories
    const typePrompt = `What type of location is "${location}"? Respond with only one word: city, museum, building, monument, nature, restaurant, or other.`;

    const locationType = await callLLM(typePrompt, 50);
    const categories = CATEGORY_TEMPLATES[locationType.toLowerCase().trim()] || CATEGORY_TEMPLATES.default;

    // Generate content for each category with two truths and a lie
    const prompt = `You are a travel guide writer. ${writingStyle.prompt}

Create a travel guide for "${location}".

For each of the following categories, provide exactly 3 items - TWO TRUTHS and ONE LIE (the lie should be plausible but false). Mix them randomly - don't always put the lie in the same position.

Categories: ${categories.join(', ')}

Format your response as JSON with this structure:
{
  "name": "${location}",
  "type": "${locationType}",
  "coordinates": {"lat": approximate_latitude, "lon": approximate_longitude},
  "categories": [
    {
      "name": "Category Name",
      "items": [
        {
          "text": "Item description (2-3 sentences). Include specific place names when relevant.",
          "isLie": false
        },
        {
          "text": "Another item description.",
          "isLie": false
        },
        {
          "text": "A third item (this one is false).",
          "isLie": true
        }
      ]
    }
  ]
}

Make the content engaging and informative. Include specific place names, street names, and nearby locations when relevant - these will become clickable links. Make the lie plausible but definitely false.`;

    const response = await callLLM(prompt, 4000);

    // Parse JSON response
    let placeData;
    try {
        // Extract JSON from response (in case there's extra text)
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

    // Extract and geocode mentioned places
    placeData.mentionedPlaces = await extractAndGeocodePlaces(placeData);

    return placeData;
}

// Call OpenRouter LLM
async function callLLM(prompt, maxTokens = 2000) {
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
        const error = await response.text();
        throw new Error(`API Error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Extract place names from content and geocode them
async function extractAndGeocodePlaces(placeData) {
    const mentionedPlaces = new Set();

    // Extract potential place names (capitalized phrases)
    placeData.categories.forEach(category => {
        category.items.forEach(item => {
            // Look for capitalized words/phrases (potential place names)
            const matches = item.text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
            if (matches) {
                matches.forEach(match => {
                    // Filter out common words
                    if (!['The', 'A', 'An', 'In', 'On', 'At', 'For', 'To', 'From', 'This', 'That'].includes(match)) {
                        mentionedPlaces.add(match);
                    }
                });
            }
        });
    });

    // Geocode places (using Nominatim - free OpenStreetMap geocoding)
    const geocodedPlaces = [];
    const placesArray = Array.from(mentionedPlaces).slice(0, 10); // Limit to 10 to avoid rate limiting

    for (const place of placesArray) {
        try {
            const coords = await geocodePlace(place);
            if (coords) {
                geocodedPlaces.push({ name: place, ...coords });
            }
        } catch (error) {
            console.error(`Failed to geocode ${place}:`, error);
        }
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return geocodedPlaces;
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

    const revealBtn = document.createElement('button');
    revealBtn.className = 'reveal-btn';
    revealBtn.innerHTML = '<span>Is this the lie?</span>';
    revealBtn.onclick = () => revealItem(itemEl, item.isLie);

    itemEl.appendChild(textEl);
    itemEl.appendChild(revealBtn);

    return itemEl;
}

// Convert place names to clickable links
function convertPlaceNamesToLinks(text) {
    // Match capitalized phrases that could be place names
    return text.replace(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g, (match) => {
        // Skip common words
        if (['The', 'A', 'An', 'In', 'On', 'At', 'For', 'To', 'From', 'This', 'That', 'These', 'Those'].includes(match)) {
            return match;
        }
        return `<a href="#" class="place-link" onclick="handlePlaceLink(event, '${match.replace(/'/g, "\\'")}')">${match}</a>`;
    });
}

// Handle place link clicks
function handlePlaceLink(event, placeName) {
    event.preventDefault();
    loadPlace(placeName, true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Reveal if item is truth or lie
function revealItem(itemEl, isLie) {
    if (itemEl.classList.contains('revealed')) return;

    itemEl.classList.add('revealed');

    if (isLie) {
        itemEl.classList.add('is-lie');
        updateScore(10);
        showNotification('🎯 Correct! This was the lie! +10 points', 'success');
    } else {
        itemEl.classList.add('is-truth');
        updateScore(-5);
        showNotification('❌ Wrong! This is actually true. -5 points', 'error');
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
}

// Initialize Map
function initializeMap(placeData) {
    // Clear existing map
    if (AppState.map) {
        AppState.map.remove();
    }

    // Create map centered on location
    const coords = placeData.coordinates || { lat: 0, lon: 0 };
    AppState.map = L.map('map').setView([coords.lat, coords.lon], 13);

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

    // Add markers for mentioned places
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

        // Fit map to show all markers
        const bounds = L.latLngBounds([coords.lat, coords.lon]);
        placeData.mentionedPlaces.forEach(place => {
            bounds.extend([place.lat, place.lon]);
        });
        AppState.map.fitBounds(bounds, { padding: [50, 50] });
    }
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
window.closeApiKeyModal = closeApiKeyModal;
window.saveApiKey = saveApiKey;
window.handlePlaceLink = handlePlaceLink;
window.navigateToBreadcrumb = navigateToBreadcrumb;
