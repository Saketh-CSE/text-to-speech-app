import React, { useState, useEffect, useRef, useCallback } from 'react';

const Converter = () => {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [fileName, setFileName] = useState('');

  // Speech state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [statusText, setStatusText] = useState('Ready');

  // --- NEW --- Backend state
  const [isBackendLoading, setIsBackendLoading] = useState(false);
  const [backendMessage, setBackendMessage] = useState('');
  // --- END NEW ---

  // Refs
  const synth = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isAudioGenerated, setIsAudioGenerated] = useState(false);

  // Load voices
  const loadVoices = useCallback(() => {
    const availableVoices = synth.current.getVoices();
    setVoices(availableVoices);
    
    const defaultVoiceIndex = availableVoices.findIndex(v => v.default);
    setSelectedVoiceIndex(defaultVoiceIndex > -1 ? defaultVoiceIndex : 0);
  }, []);

  useEffect(() => {
    if (!synth.current) {
      alert("Your browser doesn't support text to speech!");
      return;
    }
    loadVoices();
    if (synth.current.onvoiceschanged !== undefined) {
      synth.current.onvoiceschanged = loadVoices;
    }
  }, [loadVoices]);

  // Event Handlers
  const handleTextChange = (e) => {
    setText(e.target.value);
    if (synth.current.speaking) {
      handleStop(); // Stop speech if text is changed
    }
    setIsAudioGenerated(false);
    setAudioBlob(null);
    setBackendMessage(''); // Clear backend message
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setStatusText('Reading file...');
    const reader = new FileReader();
    reader.onload = (e) => {
      setText(e.target.result);
      setStatusText('File loaded');
    };
    reader.onerror = () => {
      alert('Error reading file');
      setStatusText('Error reading file');
    };
    reader.readAsText(file);
  };

  // --- THIS IS YOUR ORIGINAL FUNCTION ---
  const handleSpeak = () => {
    if (synth.current.speaking || !text.trim()) return;

    setBackendMessage('');
    utteranceRef.current = new SpeechSynthesisUtterance(text);
    const utterance = utteranceRef.current;

    utterance.voice = voices[selectedVoiceIndex];
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setStatusText('Speaking (Browser)');
    };
    utterance.onpause = () => {
      setIsPaused(true);
      setStatusText('Paused (Browser)');
    };
    utterance.onresume = () => {
      setIsPaused(false);
      setStatusText('Speaking (Browser)');
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setStatusText('Finished (Browser)');
      attemptAudioGeneration(); // Mock audio gen
    };
    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      setIsSpeaking(false);
      setIsPaused(false);
      setStatusText('Error');
    };

    synth.current.speak(utterance);
  };

  // --- THIS IS YOUR NEW BACKEND FUNCTION ---
  const handlePremiumSpeak = async () => {
    if (!text.trim() || isBackendLoading) return;

    // 1. Set loading state
    setIsBackendLoading(true);
    setBackendMessage('');
    setStatusText('Connecting to backend...');
    handleStop(); // Stop any browser speech

    try {
      // 2. Call our backend API
      const response = await fetch('http://localhost:3001/api/premium-speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          voice: voices[selectedVoiceIndex]?.name || 'default',
          rate: rate,
          pitch: pitch
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // 3. Get the (simulated) data back
      const data = await response.json();

      console.log('Backend response:', data);
      setStatusText('Backend simulation successful');
      setBackendMessage(data.message + ` (Fake URL: ${data.audioUrl})`);
      
      // In a real app, you would now play the audio from data.audioUrl
      // const audio = new Audio(data.audioUrl);
      // audio.play();

    } catch (error) {
      console.error('Error connecting to backend:', error);
      setStatusText('Error connecting to backend');
      setBackendMessage('Error: Could not connect to the server. Is it running?');
    } finally {
      // 4. Unset loading state
      setIsBackendLoading(false);
    }
  };
  // --- END NEW FUNCTION ---

  const handlePause = () => {
    if (synth.current.speaking) {
      synth.current.pause();
    }
  };

  // --- THIS IS THE MISSING FUNCTION ---
  const handleResume = () => {
    if (synth.current.paused) {
      synth.current.resume();
    }
  };
  // --- END MISSING FUNCTION ---

  const handleStop = () => {
    if (synth.current.speaking) {
      synth.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setStatusText('Stopped');
    }
  };

  // Mock audio generation for download
  const attemptAudioGeneration = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      const mediaStreamDestination = audioContext.createMediaStreamDestination();
      gainNode.connect(mediaStreamDestination);
      const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        setIsAudioGenerated(true);
      };

      mediaRecorder.start();
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        mediaRecorder.stop();
        audioContext.close();
      }, 100);
    } catch (error) {
      console.error("Mock audio blob generation failed:", error);
    }
  };

  const handleDownload = () => {
    if (!isAudioGenerated || !audioBlob) {
      alert("No audio available for download. Please speak some text first.");
      return;
    }
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    a.href = url;
    a.download = "text-to-speech.wav";
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };
  
  // Status circle class logic
  let statusCircleClass = "status-circle";
  if (isSpeaking && !isPaused) statusCircleClass += " speaking";
  if (isPaused) statusCircleClass += " paused";
  if (isBackendLoading) statusCircleClass += " speaking"; // Re-use speaking animation

  return (
    <section className="converter-section">
      <div className="converter-container">
        <div className="text-input-container">
          <h2>Enter Your Text</h2>
          <textarea
            id="text-input"
            placeholder="Type or paste your text here..."
            value={text}
            onChange={handleTextChange}
          ></textarea>
          <div className="file-upload-container">
            <label htmlFor="file-upload" className="file-upload-label">
              <i className="fas fa-file-upload"></i> Upload Text File
            </label>
            <input
              type="file"
              id="file-upload"
              accept=".txt,.md,.rtf,.doc,.docx"
              onChange={handleFileChange}
            />
            <span id="file-name">{fileName}</span>
          </div>
          <div className="character-counter">
            <span id="char-count">{text.length}</span> characters
          </div>
        </div>

        <div className="controls-container">
          <div className="voice-controls">
            <div className="control-group">
              <label htmlFor="voice-select">Voice:</label>
              <select
                id="voice-select"
                className="control-select"
                value={selectedVoiceIndex}
                onChange={(e) => setSelectedVoiceIndex(e.target.value)}
              >
                {voices.map((voice, index) => (
                  <option key={index} value={index}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
            <div className="control-group">
              <label htmlFor="rate-input">Speed:</label>
              <div className="range-container">
                <input
                  type="range"
                  id="rate-input"
                  min="0.5"
                  max="2"
                  value={rate}
                  step="0.1"
                  className="slider"
                  onChange={(e) => setRate(e.target.value)}
                />
                <span id="rate-value">{rate}x</span>
              </div>
            </div>
            <div className="control-group">
              <label htmlFor="pitch-input">Pitch:</label>
              <div className="range-container">
                <input
                  type="range"
                  id="pitch-input"
                  min="0.5"
                  max="2"
                  value={pitch}
                  step="0.1"
                  className="slider"
                  onChange={(e) => setPitch(e.target.value)}
                />
                <span id="pitch-value">{pitch}x</span>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button
              id="speak-btn"
              className="btn primary large"
              onClick={handleSpeak}
              disabled={isSpeaking || isBackendLoading || !text.trim()}
            >
              <i className="fas fa-play"></i> Speak (Browser)
            </button>
            
            {/* --- NEW PREMIUM BUTTON --- */}
            <button
              id="premium-speak-btn"
              className="btn secondary large"
              onClick={handlePremiumSpeak}
              disabled={isBackendLoading || isSpeaking || !text.trim()}
            >
              <i className="fas fa-star"></i> {isBackendLoading ? 'Generating...' : 'Premium (Backend)'}
            </button>
            {/* --- END NEW --- */}
          </div>
          
          <div className="action-buttons">
            <button
              id="pause-btn"
              className="btn large"
              onClick={handlePause}
              disabled={!isSpeaking || isPaused || isBackendLoading}
            >
              <i className="fas fa-pause"></i> Pause
            </button>
            <button
              id="resume-btn"
              className="btn large"
              onClick={handleResume}
              disabled={!isPaused || isBackendLoading}
            >
              <i className="fas fa-forward"></i> Resume
            </button>
            <button
              id="stop-btn"
              className="btn large"
              onClick={handleStop}
              disabled={!isSpeaking || isBackendLoading}
            >
              <i className="fas fa-stop"></i> Stop
            </button>
          </div>
        </div>

        <div className="speech-status">
          <div className="status-indicator">
            <div className={statusCircleClass}></div>
            <span id="status-text">{statusText}</span>
          </div>
        </div>

        {/* --- NEW MESSAGE DISPLAY --- */}
        {backendMessage && (
          <div className="backend-message-note">
            <p><strong>Backend Response:</strong> {backendMessage}</p>
          </div>
        )}
        {/* --- END NEW --- */}

        <div className="download-section">
          <p>Want to save your speech for later?</p>
          <button
            id="download-btn"
            className="btn secondary"
            onClick={handleDownload}
            disabled={!isAudioGenerated}
          >
            <i className="fas fa-download"></i> Download Audio
          </button>
          <p className="note">
            Note: Download feature uses browser's text-to-speech capability and may not be
            available in all browsers.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Converter;