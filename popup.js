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
});