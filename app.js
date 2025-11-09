// Diplomatic Plate Decoder - Premium Edition
let diplomaticData = null;
let svgMapInstance = null;
let lookedUpCountries = new Set(); // Track all countries that have been looked up

// ISO country code mapping for svgMap
const isoCodeMap = {
    'Republic of the Congo': 'CG',
    'Ethiopia': 'ET',
    'Côte d\'Ivoire': 'CI',
    'Burkina Faso': 'BF',
    'Uzbekistan': 'UZ',
    'Japan': 'JP',
    'South Korea': 'KR',
    'Madagascar': 'MG',
    'Senegal': 'SN',
    'Panama': 'PA',
    'Cape Verde': 'CV',
    'Cameroon': 'CM',
    'Lesotho': 'LS',
    'Malawi': 'MW',
    'Bolivia': 'BO',
    'Sri Lanka': 'LK',
    'Syria': 'SY',
    'Lebanon': 'LB',
    'Australia': 'AU',
    'Austria': 'AT',
    'Uganda': 'UG',
    'Israel': 'IL',
    'Jordan': 'JO',
    'Morocco': 'MA',
    'Yemen': 'YE',
    'New Zealand': 'NZ',
    'Angola': 'AO',
    'Bangladesh': 'BD',
    'Botswana': 'BW',
    'Benin': 'BJ',
    'Belgium': 'BE',
    'Bahrain': 'BH',
    'Bulgaria': 'BG',
    'Burundi': 'BI',
    'Bahamas': 'BS',
    'Belize': 'BZ',
    'Bosnia and Herzegovina': 'BA',
    'Brazil': 'BR',
    'Myanmar': 'MM',
    'Brunei': 'BN',
    'Belarus': 'BY',
    'Solomon Islands': 'SB',
    'Barbados': 'BB',
    'Bhutan': 'BT',
    'Equatorial Guinea': 'GQ',
    'Eswatini': 'SZ',
    'Togo': 'TG',
    'Guinea-Bissau': 'GW',
    'Comoros': 'KM',
    'Mauritius': 'MU',
    'Seychelles': 'SC',
    'Mozambique': 'MZ',
    'Canada': 'CA',
    'Chile': 'CL',
    'China': 'CN',
    'Cambodia': 'KH',
    'Colombia': 'CO',
    'Chad': 'TD',
    'Cuba': 'CU',
    'Croatia': 'HR',
    'Costa Rica': 'CR',
    'Cyprus': 'CY',
    'Czechia': 'CZ',
    'Denmark': 'DK',
    'Dominican Republic': 'DO',
    'Ecuador': 'EC',
    'Algeria': 'DZ',
    'El Salvador': 'SV',
    'Estonia': 'EE',
    'Egypt': 'EG',
    'Finland': 'FI',
    'Fiji': 'FJ',
    'France': 'FR',
    'Djibouti': 'DJ',
    'Gabon': 'GA',
    'Gambia': 'GM',
    'Germany': 'DE',
    'Ghana': 'GH',
    'Greece': 'GR',
    'Grenada': 'GD',
    'Guatemala': 'GT',
    'Guinea': 'GN',
    'Guyana': 'GY',
    'Haiti': 'HT',
    'Honduras': 'HN',
    'Hungary': 'HU',
    'Iceland': 'IS',
    'India': 'IN',
    'Indonesia': 'ID',
    'Iraq': 'IQ',
    'Ireland': 'IE',
    'Iran': 'IR',
    'Italy': 'IT',
    'Jamaica': 'JM',
    'Kenya': 'KE',
    'Kuwait': 'KW',
    'Laos': 'LA',
    'Libya': 'LY',
    'Liberia': 'LR',
    'Latvia': 'LV',
    'Lithuania': 'LT',
    'Luxembourg': 'LU',
    'North Macedonia': 'MK',
    'Mali': 'ML',
    'Malta': 'MT',
    'Mauritania': 'MR',
    'Mexico': 'MX',
    'Mongolia': 'MN',
    'Niger': 'NE',
    'Nigeria': 'NG',
    'Nicaragua': 'NI',
    'Norway': 'NO',
    'Nepal': 'NP',
    'Netherlands': 'NL',
    'Oman': 'OM',
    'Pakistan': 'PK',
    'Paraguay': 'PY',
    'Peru': 'PE',
    'Philippines': 'PH',
    'Poland': 'PL',
    'Portugal': 'PT',
    'Papua New Guinea': 'PG',
    'Qatar': 'QA',
    'Romania': 'RO',
    'Rwanda': 'RW',
    'Russia': 'RU',
    'Saudi Arabia': 'SA',
    'South Africa': 'ZA',
    'Sierra Leone': 'SL',
    'Singapore': 'SG',
    'Somalia': 'SO',
    'Spain': 'ES',
    'Sudan': 'SD',
    'Suriname': 'SR',
    'Sweden': 'SE',
    'Switzerland': 'CH',
    'Thailand': 'TH',
    'Trinidad and Tobago': 'TT',
    'Tunisia': 'TN',
    'Turkey': 'TR',
    'Tanzania': 'TZ',
    'Ukraine': 'UA',
    'United Arab Emirates': 'AE',
    'United Kingdom': 'GB',
    'Uruguay': 'UY',
    'Venezuela': 'VE',
    'Vietnam': 'VN',
    'Western Samoa': 'WS',
    'Zambia': 'ZM',
    'Zimbabwe': 'ZW',
    'Kazakhstan': 'KZ',
    'Kyrgyzstan': 'KG',
    'Tajikistan': 'TJ',
    'Turkmenistan': 'TM',
    'Armenia': 'AM',
    'Azerbaijan': 'AZ',
    'Georgia': 'GE',
    'Moldova': 'MD',
    'Namibia': 'NA',
    'Eritrea': 'ER',
    'Slovakia': 'SK',
    'Slovenia': 'SI',
    'Palau': 'PW',
    'Marshall Islands': 'MH',
    'Micronesia': 'FM',
    'East Timor': 'TL',
    'South Sudan': 'SS',
    'Kosovo': 'XK',
    'Montenegro': 'ME',
    'Serbia': 'RS',
    'Afghanistan': 'AF',
    'Albania': 'AL',
    'Argentina': 'AR'
};

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    await loadDiplomaticData();
    initializeEventListeners();
    loadRecentLookups();
    initializeMap();
});

// Load diplomatic data
async function loadDiplomaticData() {
    try {
        const response = await fetch('diplomatic-data.json');
        diplomaticData = await response.json();
        console.log('Diplomatic data loaded successfully');
    } catch (error) {
        console.error('Error loading diplomatic data:', error);
        showNotification('Failed to load data. Please refresh the page.', 'error');
    }
}

// Initialize event listeners
function initializeEventListeners() {
    const plateInput = document.getElementById('plateCode');
    const decodeBtn = document.getElementById('decodeBtn');

    // Decode button click
    decodeBtn.addEventListener('click', handleDecode);

    // Enter key to decode
    plateInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleDecode();
        }
    });

    // Auto-uppercase input
    plateInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });

    // Example chips
    const exampleChips = document.querySelectorAll('.example-chip');
    exampleChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const code = chip.getAttribute('data-code');
            plateInput.value = code;
            handleDecode();
        });
    });
}

// Handle decode
function handleDecode() {
    const plateCode = document.getElementById('plateCode').value.toUpperCase().trim();

    if (!plateCode || plateCode.length !== 3) {
        showNotification('Please enter a 3-letter code (e.g., DAF)', 'error');
        return;
    }

    // Parse the code: first letter is staff type, next two are country
    const staffCode = plateCode[0];
    const countryCode = plateCode.substring(1, 3);

    const staffInfo = diplomaticData.staffCodes[staffCode];
    const countryInfo = diplomaticData.countryCodes[countryCode];

    if (!staffInfo) {
        showNotification(`Staff code "${staffCode}" not recognized. Valid codes: D, C, S, A, M`, 'error');
        return;
    }

    if (!countryInfo) {
        showNotification(`Country code "${countryCode}" not found. Please verify the code.`, 'error');
        return;
    }

    displayResults(plateCode, staffCode, staffInfo, countryCode, countryInfo);
    saveToRecent(plateCode, staffInfo, countryInfo);
}

// Display results
function displayResults(plateCode, staffCode, staffInfo, countryCode, countryInfo) {
    // Update country info
    document.getElementById('countryFlag').textContent = countryInfo.flag;
    document.getElementById('countryName').textContent = countryInfo.country;
    document.getElementById('countryRegion').textContent = countryInfo.region;

    // Update details
    document.getElementById('plateCodeDisplay').textContent = plateCode;
    document.getElementById('staffType').textContent = staffInfo.title;
    document.getElementById('countryCode').textContent = countryCode;

    // Show results section
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.classList.add('show');

    // Scroll to results
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    // Initialize or update map
    updateMap(countryInfo);
}

// Initialize map once
function initializeMap() {
    try {
        svgMapInstance = new svgMap({
            targetElementID: 'svgMap',
            data: {
                data: {
                    count: {
                        name: 'Decoded Plates',
                        format: '{0}',
                        thousandSeparator: ',',
                        thresholdMax: 100,
                        thresholdMin: 1
                    }
                },
                applyData: 'count',
                values: {}
            },
            colorMax: '#3B82F6',
            colorMin: '#3B82F6',
            colorNoData: '#F1F5F9',
            flagType: 'emoji',
            hideFlag: false,
            noDataText: 'Not yet decoded'
        });
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

// Update map with new country
function updateMap(countryInfo) {
    const isoCode = isoCodeMap[countryInfo.country];

    if (!isoCode) {
        console.warn(`No ISO code found for ${countryInfo.country}`);
        return;
    }

    // Add to the set of looked-up countries
    lookedUpCountries.add(isoCode);

    // Rebuild map data with all looked-up countries
    const mapData = {};
    lookedUpCountries.forEach(code => {
        mapData[code] = { count: 1 };
    });

    // Destroy and recreate the map with updated data
    if (svgMapInstance) {
        document.getElementById('svgMap').innerHTML = '';
    }

    try {
        svgMapInstance = new svgMap({
            targetElementID: 'svgMap',
            data: {
                data: {
                    count: {
                        name: 'Decoded Plates',
                        format: '{0}',
                        thousandSeparator: ',',
                        thresholdMax: 100,
                        thresholdMin: 1
                    }
                },
                applyData: 'count',
                values: mapData
            },
            colorMax: '#3B82F6',
            colorMin: '#3B82F6',
            colorNoData: '#F1F5F9',
            flagType: 'emoji',
            hideFlag: false,
            noDataText: 'Not yet decoded'
        });
    } catch (error) {
        console.error('Error updating map:', error);
    }
}

// Save to recent lookups
function saveToRecent(plateCode, staffInfo, countryInfo) {
    let recent = getRecentLookups();

    const lookup = {
        code: plateCode,
        country: countryInfo.country,
        flag: countryInfo.flag,
        staffType: staffInfo.title,
        timestamp: Date.now()
    };

    // Remove duplicate if exists
    recent = recent.filter(item => item.code !== plateCode);

    // Add to beginning
    recent.unshift(lookup);

    // Keep only last 10
    recent = recent.slice(0, 10);

    localStorage.setItem('diplomaticRecentLookups', JSON.stringify(recent));

    loadRecentLookups();
}

// Get recent lookups
function getRecentLookups() {
    try {
        const recent = localStorage.getItem('diplomaticRecentLookups');
        return recent ? JSON.parse(recent) : [];
    } catch (error) {
        console.error('Error reading recent lookups:', error);
        return [];
    }
}

// Load and display recent lookups
function loadRecentLookups() {
    const recentGrid = document.getElementById('recentGrid');
    const recent = getRecentLookups();

    if (recent.length === 0) {
        recentGrid.innerHTML = `
            <div class="empty-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p>No recent lookups</p>
            </div>
        `;
        return;
    }

    recentGrid.innerHTML = recent.map(item => `
        <div class="recent-item" onclick="loadLookup('${item.code}')">
            <div class="recent-item-header">
                <span class="recent-flag">${item.flag}</span>
                <span class="recent-code">${item.code}</span>
            </div>
            <div class="recent-country">${item.country}</div>
            <div class="recent-staff">${item.staffType}</div>
        </div>
    `).join('');
}

// Load a lookup from recent
function loadLookup(code) {
    document.getElementById('plateCode').value = code;
    handleDecode();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${type === 'error' ? '#EF4444' : '#3B82F6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
        font-weight: 500;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
