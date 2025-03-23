// Cache keys
const CACHE_KEYS = {
    API_KEY: 'openai_api_key',
    VOICE: 'selected_voice',
    SPEED: 'speech_speed',
    LAST_TEXT: 'last_text'
};

// DOM Elements
const elements = {
    apiKey: document.getElementById('apiKey'),
    saveKey: document.getElementById('saveKey'),
    voice: document.getElementById('voice'),
    speed: document.getElementById('speed'),
    speedValue: document.getElementById('speedValue'),
    text: document.getElementById('text'),
    pasteFromClipboard: document.getElementById('pasteFromClipboard'),
    generate: document.getElementById('generate'),
    status: document.getElementById('status'),
    audioControls: document.getElementById('audioControls'),
    audioPlayer: document.getElementById('audioPlayer'),
    playPause: document.getElementById('playPause'),
    playIcon: document.querySelector('.play-icon'),
    pauseIcon: document.querySelector('.pause-icon'),
    downloadAudio: document.getElementById('downloadAudio')
};

// Load cached values
document.addEventListener('DOMContentLoaded', () => {
    // Load API key
    chrome.storage.local.get([CACHE_KEYS.API_KEY], (result) => {
        if (result[CACHE_KEYS.API_KEY]) {
            elements.apiKey.value = result[CACHE_KEYS.API_KEY];
        }
    });

    // Load voice preference
    const cachedVoice = localStorage.getItem(CACHE_KEYS.VOICE);
    if (cachedVoice) {
        elements.voice.value = cachedVoice;
    }

    // Load speed preference
    const cachedSpeed = localStorage.getItem(CACHE_KEYS.SPEED);
    if (cachedSpeed) {
        elements.speed.value = cachedSpeed;
        elements.speedValue.textContent = cachedSpeed;
    }

    // Load last used text
    const cachedText = localStorage.getItem(CACHE_KEYS.LAST_TEXT);
    if (cachedText) {
        elements.text.value = cachedText;
    }
});

// Save API Key
elements.saveKey.addEventListener('click', () => {
    const apiKey = elements.apiKey.value.trim();
    if (!apiKey) {
        showStatus('Bitte geben Sie einen API-Schlüssel ein', 'error');
        return;
    }

    chrome.storage.local.set({ [CACHE_KEYS.API_KEY]: apiKey }, () => {
        showStatus('API-Schlüssel gespeichert', 'success');
    });
});

// Update speed value display and cache
elements.speed.addEventListener('input', (e) => {
    const speed = e.target.value;
    elements.speedValue.textContent = speed;
    localStorage.setItem(CACHE_KEYS.SPEED, speed);
});

// Cache voice selection
elements.voice.addEventListener('change', (e) => {
    localStorage.setItem(CACHE_KEYS.VOICE, e.target.value);
});

// Paste from clipboard
elements.pasteFromClipboard.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        elements.text.value = text;
        localStorage.setItem(CACHE_KEYS.LAST_TEXT, text);
        showStatus('Text aus Zwischenablage eingefügt', 'success');
    } catch (error) {
        showStatus('Fehler beim Lesen der Zwischenablage', 'error');
    }
});

// Cache text input
elements.text.addEventListener('input', (e) => {
    localStorage.setItem(CACHE_KEYS.LAST_TEXT, e.target.value);
});

// Generate audio
elements.generate.addEventListener('click', async () => {
    const text = elements.text.value.trim();
    if (!text) {
        showStatus('Bitte geben Sie Text ein', 'error');
        return;
    }

    elements.generate.disabled = true;
    showStatus('Generiere Audio...', 'info');

    try {
        const apiKey = await getApiKey();
        if (!apiKey) {
            throw new Error('Kein API-Schlüssel gefunden');
        }

        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'tts-1',
                input: text,
                voice: elements.voice.value,
                speed: parseFloat(elements.speed.value)
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        // Update audio player
        elements.audioPlayer.src = url;
        elements.audioControls.classList.remove('hidden');
        elements.audioPlayer.play();
        
        // Update play/pause button state
        updatePlayPauseState(true);

        // Enable download button
        elements.downloadAudio.onclick = () => {
            const a = document.createElement('a');
            a.href = url;
            a.download = 'tts-audio.mp3';
            a.click();
        };

        showStatus('Audio erfolgreich generiert', 'success');
    } catch (error) {
        console.error('Error:', error);
        showStatus(`Fehler: ${error.message}`, 'error');
    } finally {
        elements.generate.disabled = false;
    }
});

// Audio player controls
elements.playPause.addEventListener('click', () => {
    if (elements.audioPlayer.paused) {
        elements.audioPlayer.play();
        updatePlayPauseState(true);
    } else {
        elements.audioPlayer.pause();
        updatePlayPauseState(false);
    }
});

elements.audioPlayer.addEventListener('ended', () => {
    updatePlayPauseState(false);
});

// Helper functions
async function getApiKey() {
    return new Promise((resolve) => {
        chrome.storage.local.get([CACHE_KEYS.API_KEY], (result) => {
            resolve(result[CACHE_KEYS.API_KEY]);
        });
    });
}

function showStatus(message, type = '') {
    elements.status.textContent = message;
    elements.status.className = 'status ' + type;
    
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            elements.status.textContent = '';
            elements.status.className = 'status';
        }, 3000);
    }
}

function updatePlayPauseState(isPlaying) {
    elements.playIcon.classList.toggle('hidden', isPlaying);
    elements.pauseIcon.classList.toggle('hidden', !isPlaying);
}