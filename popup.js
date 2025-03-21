// Beim Laden der Seite: Cache prüfen
document.addEventListener('DOMContentLoaded', () => {
  // Lade gespeicherte Einstellungen
  chrome.storage.local.get(['apiKey', 'voice', 'speed'], (result) => {
    if (result.apiKey) {
      document.getElementById('apiKey').value = result.apiKey;
      console.log('API-Schlüssel aus dem Speicher geladen');
    }
    
    if (result.voice) {
      document.getElementById('voice').value = result.voice;
      console.log('Stimme aus dem Speicher geladen:', result.voice);
    }
    
    if (result.speed) {
      document.getElementById('speed').value = result.speed;
      document.getElementById('speedValue').textContent = result.speed;
      console.log('Geschwindigkeit aus dem Speicher geladen:', result.speed);
    }
  });

  // Funktion zum Überprüfen und Injizieren des Content Scripts
  async function ensureContentScriptLoaded(tabId) {
    try {
      // Hole Tab-Informationen
      const tab = await chrome.tabs.get(tabId);
      
      // Überprüfe, ob es sich um eine chrome:// URL handelt
      if (tab.url.startsWith('chrome://')) {
        throw new Error('Text kann nicht von Chrome-System-Seiten geladen werden');
      }
      
      // Versuche eine Test-Nachricht zu senden
      await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    } catch (error) {
      // Wenn es eine chrome:// URL ist, werfe den Fehler weiter
      if (error.message.includes('Chrome-System-Seiten')) {
        throw error;
      }
      
      // Wenn das Content Script nicht antwortet, injiziere es
      console.log('Content Script wird injiziert...');
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
      // Warte kurz, damit das Script geladen werden kann
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Funktion zum Laden des Textes aus der Zwischenablage
  async function loadClipboardText() {
    const status = document.getElementById('status');
    try {
      // Prüfe, ob die Berechtigung vorhanden ist
      const permissions = await navigator.permissions.query({name: 'clipboard-read'});
      
      if (permissions.state === 'denied') {
        throw new Error('Keine Berechtigung für Zwischenablage-Zugriff');
      }
      
      const text = await navigator.clipboard.readText();
      if (text) {
        const textInput = document.getElementById('textInput');
        textInput.value = text;
        status.textContent = 'Text aus Zwischenablage geladen!';
        status.className = 'status success';
        setTimeout(() => {
          status.textContent = '';
          status.className = 'status';
        }, 2000);
        // Fokussiere das Textfeld und scrolle zum Ende
        textInput.focus();
        textInput.scrollTop = textInput.scrollHeight;
        return true;
      } else {
        status.textContent = 'Zwischenablage ist leer';
        status.className = 'status error';
        setTimeout(() => {
          status.textContent = '';
          status.className = 'status';
        }, 2000);
        return false;
      }
    } catch (error) {
      console.error('Fehler beim Laden der Zwischenablage:', error);
      let errorMessage = 'Fehler beim Laden der Zwischenablage';
      
      if (error.message.includes('Berechtigung')) {
        errorMessage = 'Bitte erlaube den Zugriff auf die Zwischenablage in den Chrome-Einstellungen';
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'Zugriff auf Zwischenablage nicht erlaubt. Bitte prüfe die Seiten-Einstellungen.';
      }
      
      status.textContent = errorMessage;
      status.className = 'status error';
      setTimeout(() => {
        status.textContent = '';
        status.className = 'status';
      }, 4000); // Längere Anzeigezeit für Fehlermeldungen
      return false;
    }
  }

  // Event-Listener für den "Text aus Zwischenablage laden" Button
  document.getElementById('loadSelectedText').addEventListener('click', async () => {
    const textWasLoaded = await loadClipboardText();
    if (textWasLoaded) {
      // Optional: Starte die Vorlesung automatisch
      // document.getElementById('readText').click();
    }
  });

  // API-Schlüssel speichern
  document.getElementById('saveApiKey').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (apiKey) {
      chrome.storage.local.set({apiKey}, () => {
        const status = document.getElementById('status');
        status.textContent = 'API-Schlüssel wurde gespeichert!';
        status.className = 'status success';
        setTimeout(() => {
          status.textContent = '';
          status.className = 'status';
        }, 2000);
        console.log('API-Schlüssel gespeichert', new Date());
      });
    } else {
      const status = document.getElementById('status');
      status.textContent = 'Bitte gib einen API-Schlüssel ein!';
      status.className = 'status error';
    }
  });
  
  // Stimme ändern und speichern
  document.getElementById('voice').addEventListener('change', (e) => {
    const voice = e.target.value;
    chrome.storage.local.set({voice}, () => {
      console.log('Stimme gespeichert:', voice);
    });
  });
  
  // Geschwindigkeit ändern und speichern
  document.getElementById('speed').addEventListener('input', (e) => {
    const speed = e.target.value;
    document.getElementById('speedValue').textContent = speed;
    chrome.storage.local.set({speed}, () => {
      console.log('Geschwindigkeit gespeichert:', speed);
    });
  });

  // Text in Sätze aufteilen
  function splitIntoSentences(text) {
    // Teilt den Text an Punkten, Ausrufezeichen und Fragezeichen, behält die Satzzeichen
    return text.match(/[^.!?]+[.!?]+/g) || [text];
  }

  // Globale Variablen für Audio-Steuerung
  let currentAudioUrl = null;
  let audioPlayer = null;
  let isPlaying = false;

  // Audio-Player initialisieren
  audioPlayer = document.getElementById('audioPlayer');
  const playPauseButton = document.getElementById('playPause');
  const downloadButton = document.getElementById('downloadAudio');
  
  // Play/Pause Button Event Listener
  playPauseButton.addEventListener('click', () => {
    if (isPlaying) {
      audioPlayer.pause();
    } else {
      audioPlayer.play();
    }
  });

  // Audio Player Events
  audioPlayer.addEventListener('play', () => {
    isPlaying = true;
    document.querySelector('.play-icon').classList.add('hidden');
    document.querySelector('.pause-icon').classList.remove('hidden');
  });

  audioPlayer.addEventListener('pause', () => {
    isPlaying = false;
    document.querySelector('.play-icon').classList.remove('hidden');
    document.querySelector('.pause-icon').classList.add('hidden');
  });

  // Download Button Event Listener
  downloadButton.addEventListener('click', () => {
    if (currentAudioUrl) {
      const a = document.createElement('a');
      a.href = currentAudioUrl;
      a.download = 'tts_audio.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  });

  // Modifizierte generateSentenceAudio Funktion
  async function generateSentenceAudio(sentence, apiKey, voice, speed) {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: sentence.trim(),
        voice: voice,
        speed: speed
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API-Fehler: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const audioData = await response.arrayBuffer();
    const blob = new Blob([audioData], { type: 'audio/mpeg' });
    return URL.createObjectURL(blob);
  }

  // Modifizierter Click-Handler für den "Generieren" Button
  document.getElementById('readText').addEventListener('click', async () => {
    const text = document.getElementById('textInput').value.trim();
    if (!text) {
      const status = document.getElementById('status');
      status.textContent = 'Bitte gib einen Text ein!';
      status.className = 'status error';
      return;
    }

    // Hole API-Schlüssel und Einstellungen
    chrome.storage.local.get(['apiKey', 'voice', 'speed'], async (result) => {
      const apiKey = result.apiKey;
      const voice = result.voice || 'nova';
      const speed = parseFloat(result.speed) || 1.0;
      
      if (!apiKey) {
        const status = document.getElementById('status');
        status.textContent = 'Bitte zuerst API-Schlüssel speichern!';
        status.className = 'status error';
        return;
      }

      const status = document.getElementById('status');
      const readButton = document.getElementById('readText');
      
      // Deaktiviere den Button während der Verarbeitung
      readButton.disabled = true;
      readButton.textContent = 'Wird generiert...';

      try {
        // Generiere Audio für den gesamten Text
        status.textContent = 'Generiere Audio...';
        status.className = 'status';
        
        // Wenn es eine vorherige Audio-URL gibt, diese freigeben
        if (currentAudioUrl) {
          URL.revokeObjectURL(currentAudioUrl);
        }

        // Generiere neue Audio
        const audioUrl = await generateSentenceAudio(text, apiKey, voice, speed);
        currentAudioUrl = audioUrl;

        // Aktualisiere Audio-Player
        const audioPlayer = document.getElementById('audioPlayer');
        audioPlayer.src = audioUrl;
        
        // Zeige Audio-Controls an
        document.getElementById('audioControls').classList.remove('hidden');
        
        // Starte Wiedergabe automatisch
        audioPlayer.play();

        // Status aktualisieren
        status.textContent = 'Audio wurde erfolgreich generiert!';
        status.className = 'status success';
        
        // Button zurücksetzen
        readButton.disabled = false;
        readButton.textContent = 'Generieren';
        
      } catch (error) {
        console.error('Fehler bei der Audio-Generierung:', error);
        status.textContent = `Fehler: ${error.message}`;
        status.className = 'status error';
        readButton.disabled = false;
        readButton.textContent = 'Generieren';
      }
    });
  });

  // Listener für markierten Text (wenn Text während Popup offen markiert wird)
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'textSelected') {
      const textInput = document.getElementById('textInput');
      textInput.value = request.text;
      const status = document.getElementById('status');
      status.textContent = 'Neuer Text wurde geladen!';
      status.className = 'status success';
      setTimeout(() => {
        status.textContent = '';
        status.className = 'status';
      }, 2000);
    }
  });
});