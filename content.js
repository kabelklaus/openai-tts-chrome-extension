// Event-Listener für Nachrichten vom Background-Script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Ping-Anfrage beantworten
  if (request.action === 'ping') {
    sendResponse({ status: 'ok' });
    return true;
  }
  
  // Wenn die Nachricht anfordert, den ausgewählten Text zu bekommen
  if (request.action === 'getSelectedText') {
    // Hole den ausgewählten Text
    const selectedText = window.getSelection().toString().trim();
    
    console.log('Ausgewählter Text:', selectedText ? `${selectedText.substring(0, 50)}...` : 'Kein Text ausgewählt');
    
    // Sende den ausgewählten Text zurück
    sendResponse({ selectedText });
  }
  
  // Wenn die Nachricht bittet, Audio abzuspielen
  else if (request.action === 'playAudio' && request.audioUrl) {
    console.log('Audio-URL erhalten, spiele Audio ab');
    
    // Erstelle ein Audio-Element
    const audio = new Audio(request.audioUrl);
    
    // Füge Event-Listener hinzu
    audio.addEventListener('play', () => {
      console.log('Audio-Wiedergabe gestartet');
    });
    
    audio.addEventListener('ended', () => {
      console.log('Audio-Wiedergabe beendet');
      // Entferne die URL, um Speicher freizugeben
      URL.revokeObjectURL(request.audioUrl);
    });
    
    audio.addEventListener('error', (e) => {
      console.error('Fehler bei der Audio-Wiedergabe:', e);
    });
    
    // Spiele das Audio ab
    audio.play();
    
    sendResponse({ success: true });
  }
  
  // Wichtig für asynchrone Antworten
  return true;
});

// Event-Listener für Text-Auswahl
document.addEventListener('mouseup', () => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    // Sende den ausgewählten Text an das Popup
    chrome.runtime.sendMessage({
      action: 'textSelected',
      text: selectedText
    });
  }
});