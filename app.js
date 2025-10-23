// Diplomatic Plate Decoder - Main Application
let diplomaticData = null;

// Regional coordinates for map visualization
const regionCoordinates = {
    'Africa': { x: 450, y: 250 },
    'Asia': { x: 600, y: 200 },
    'Europe': { x: 450, y: 150 },
    'Middle East': { x: 520, y: 210 },
    'Americas': { x: 250, y: 220 },
    'Oceania': { x: 700, y: 320 }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    await loadDiplomaticData();
    initializeEventListeners();
    loadRecentLookups();
});

// Load diplomatic data from JSON
async function loadDiplomaticData() {
    try {
        const response = await fetch('diplomatic-data.json');
        diplomaticData = await response.json();
        console.log('Diplomatic data loaded successfully');
    } catch (error) {
        console.error('Error loading diplomatic data:', error);
        showError('Failed to load diplomatic data. Please refresh the page.');
    }
}

// Initialize event listeners
function initializeEventListeners() {
    const lookupBtn = document.getElementById('lookupBtn');
    const countryCodeInput = document.getElementById('countryCode');
    const staffCodeInput = document.getElementById('staffCode');
    const sequenceInput = document.getElementById('sequenceNumber');

    lookupBtn.addEventListener('click', handleLookup);

    // Auto-focus next input
    countryCodeInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
        if (e.target.value.length === 2) {
            staffCodeInput.focus();
        }
    });

    staffCodeInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
        if (e.target.value.length === 1) {
            sequenceInput.focus();
        }
    });

    sequenceInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });

    // Allow Enter key to trigger lookup
    [countryCodeInput, staffCodeInput, sequenceInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLookup();
            }
        });
    });

    // Example buttons
    const exampleButtons = document.querySelectorAll('.example-btn');
    exampleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const country = btn.getAttribute('data-country');
            const staff = btn.getAttribute('data-staff');
            countryCodeInput.value = country;
            staffCodeInput.value = staff;
            sequenceInput.value = '1234';
            handleLookup();
        });
    });
}

// Handle lookup
function handleLookup() {
    const countryCode = document.getElementById('countryCode').value.toUpperCase();
    const staffCode = document.getElementById('staffCode').value.toUpperCase();
    const sequenceNumber = document.getElementById('sequenceNumber').value;

    if (!countryCode || countryCode.length !== 2) {
        showError('Please enter a valid 2-letter country code');
        return;
    }

    if (!staffCode || staffCode.length !== 1) {
        showError('Please enter a valid 1-letter staff code');
        return;
    }

    const countryInfo = diplomaticData.countryCodes[countryCode];
    const staffInfo = diplomaticData.staffCodes[staffCode];

    if (!countryInfo) {
        showError(`Country code "${countryCode}" not found. Please check and try again.`);
        return;
    }

    if (!staffInfo) {
        showError(`Staff code "${staffCode}" not recognized. Valid codes are: D, C, S, A, M`);
        return;
    }

    displayResult(countryCode, countryInfo, staffCode, staffInfo, sequenceNumber);
    saveToRecentLookups(countryCode, countryInfo, staffCode, staffInfo);
}

// Display result
function displayResult(countryCode, countryInfo, staffCode, staffInfo, sequenceNumber) {
    const resultSection = document.getElementById('resultSection');
    const resultFlag = document.getElementById('resultFlag');
    const resultCountry = document.getElementById('resultCountry');
    const resultCode = document.getElementById('resultCode');
    const resultStaff = document.getElementById('resultStaff');
    const resultRegion = document.getElementById('resultRegion');

    resultFlag.textContent = countryInfo.flag;
    resultCountry.textContent = countryInfo.country;
    resultCode.textContent = `${countryCode}-${staffCode}${sequenceNumber ? '-' + sequenceNumber : ''}`;
    resultStaff.textContent = `${staffInfo.title} - ${staffInfo.description}`;
    resultRegion.textContent = countryInfo.region;

    // Show result section with animation
    resultSection.classList.remove('show');
    setTimeout(() => {
        resultSection.classList.add('show');
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);

    // Update map
    updateMap(countryInfo);
}

// Update map visualization
function updateMap(countryInfo) {
    const mapMarker = document.getElementById('mapMarker');
    const mapText = document.getElementById('mapText');

    const coords = regionCoordinates[countryInfo.region];

    if (coords) {
        const circles = mapMarker.querySelectorAll('circle');
        circles.forEach(circle => {
            circle.setAttribute('cx', coords.x);
            circle.setAttribute('cy', coords.y);
        });

        mapMarker.style.display = 'block';
        mapText.textContent = `${countryInfo.flag} ${countryInfo.country}`;
        mapText.setAttribute('x', coords.x);
        mapText.setAttribute('y', coords.y + 40);
        mapText.setAttribute('fill', '#1f2937');
        mapText.setAttribute('font-weight', 'bold');
    }
}

// Save to recent lookups
function saveToRecentLookups(countryCode, countryInfo, staffCode, staffInfo) {
    let recent = getRecentLookups();

    const lookup = {
        countryCode,
        country: countryInfo.country,
        flag: countryInfo.flag,
        region: countryInfo.region,
        staffCode,
        staffTitle: staffInfo.title,
        timestamp: Date.now()
    };

    // Remove duplicate if exists
    recent = recent.filter(item => item.countryCode !== countryCode || item.staffCode !== staffCode);

    // Add to beginning
    recent.unshift(lookup);

    // Keep only last 10
    recent = recent.slice(0, 10);

    localStorage.setItem('diplomaticRecentLookups', JSON.stringify(recent));

    loadRecentLookups();
}

// Get recent lookups from localStorage
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
    const recentList = document.getElementById('recentList');
    const recent = getRecentLookups();

    if (recent.length === 0) {
        recentList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📋</span>
                <p>No recent lookups yet. Try decoding a plate above!</p>
            </div>
        `;
        return;
    }

    recentList.innerHTML = recent.map(item => `
        <div class="recent-item" onclick="loadLookup('${item.countryCode}', '${item.staffCode}')">
            <div class="recent-item-header">
                <span class="recent-flag">${item.flag}</span>
                <span class="recent-code">${item.countryCode}-${item.staffCode}</span>
            </div>
            <div class="recent-country">${item.country}</div>
            <div class="recent-staff">${item.staffTitle}</div>
        </div>
    `).join('');
}

// Load a lookup from recent
function loadLookup(countryCode, staffCode) {
    document.getElementById('countryCode').value = countryCode;
    document.getElementById('staffCode').value = staffCode;
    document.getElementById('sequenceNumber').value = '0000';
    handleLookup();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show error message
function showError(message) {
    // Create error overlay
    const existingError = document.querySelector('.error-overlay');
    if (existingError) {
        existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-overlay';
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 2rem;
        border-radius: 1rem;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        max-width: 400px;
        text-align: center;
        animation: bounceIn 0.5s ease-out;
    `;

    errorDiv.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <h3 style="color: #ef4444; margin-bottom: 1rem; font-size: 1.25rem;">Oops!</h3>
        <p style="color: #6b7280; margin-bottom: 1.5rem;">${message}</p>
        <button onclick="this.parentElement.remove()"
                style="background: linear-gradient(135deg, #ef4444, #dc2626);
                       color: white;
                       border: none;
                       border-radius: 0.5rem;
                       padding: 0.75rem 1.5rem;
                       font-weight: 600;
                       cursor: pointer;
                       transition: all 0.3s ease;">
            Got it!
        </button>
    `;

    document.body.appendChild(errorDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
}

// Add some fun Easter eggs
let clickCount = 0;
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('logo-icon')) {
        clickCount++;
        if (clickCount === 5) {
            showConfetti();
            clickCount = 0;
        }
    }
});

function showConfetti() {
    const confettiChars = ['🎉', '🎊', '✨', '🌟', '💫', '⭐'];
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.textContent = confettiChars[Math.floor(Math.random() * confettiChars.length)];
            confetti.style.cssText = `
                position: fixed;
                top: -50px;
                left: ${Math.random() * 100}vw;
                font-size: 2rem;
                animation: fall ${2 + Math.random() * 2}s linear forwards;
                pointer-events: none;
                z-index: 9999;
            `;
            document.body.appendChild(confetti);

            setTimeout(() => confetti.remove(), 4000);
        }, i * 50);
    }
}

// Add confetti animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
