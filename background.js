// Erstelle einen Kontextmenü-Eintrag
chrome.contextMenus.create({
  id: 'readSelectedText',
  title: 'Text vorlesen',
  contexts: ['selection']
});

// Event-Listener für Klicks auf das Extension-Icon
chrome.action.onClicked.addListener((tab) => {
  processSelectedText(tab);
});

// Event-Listener für Klicks auf den Kontextmenü-Eintrag
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'readSelectedText') {
    processSelectedText(tab);
  }
});

// Funktion zur Verarbeitung des ausgewählten Texts
async function processSelectedText(tab) {
  // Rufe den ausgewählten Text vom Content-Script ab
  chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' }, async (response) => {
    if (chrome.runtime.lastError) {
      console.error('Fehler beim Abrufen des ausgewählten Texts:', chrome.runtime.lastError);
      return;
    }

    const selectedText = response?.selectedText;
    
    // Prüfe, ob Text ausgewählt wurde
    if (!selectedText) {
      console.log('Kein Text ausgewählt');
      return;
    }
    
    console.log('Ausgewählter Text erhalten, Länge:', selectedText.length);
    
    // Hole API-Schlüssel und Stimme aus dem Speicher
    chrome.storage.local.get(['apiKey', 'voice', 'speed'], async (result) => {
      const apiKey = result.apiKey;
      const voice = result.voice || 'nova';
      const speed = parseFloat(result.speed) || 1.0;
      
      if (!apiKey) {
        console.error('Kein API-Schlüssel gefunden');
        return;
      }
      
      try {
        // Rufe die TTS-API auf
        const audioData = await callOpenAiTtsApi(apiKey, selectedText, voice, speed);
        
        // Erstelle eine Blob-URL aus den Audio-Daten
        const blob = new Blob([audioData], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(blob);
        
        // Sende die Audio-URL an das Content-Script zum Abspielen
        chrome.tabs.sendMessage(tab.id, { action: 'playAudio', audioUrl }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Fehler beim Senden der Audio-URL:', chrome.runtime.lastError);
          }
        });
      } catch (error) {
        console.error('Fehler beim Aufrufen der TTS-API:', error);
      }
    });
  });
}

// Funktion zum Aufrufen der OpenAI TTS-API
async function callOpenAiTtsApi(apiKey, text, voice, speed) {
  console.log(`Rufe TTS-API mit Stimme ${voice} und Geschwindigkeit ${speed} auf`);
  
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: voice,
      speed: speed
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API-Fehler: ${response.status} ${JSON.stringify(errorData)}`);
  }
  
  return await response.arrayBuffer();
}