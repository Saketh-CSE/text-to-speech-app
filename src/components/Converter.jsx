import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  StopCircle,
  UploadCloud,
  Download,
  AlertTriangle,
  RefreshCw,
  Star,
  Loader2, // For loading spinners
  BookOpen // For history
} from 'lucide-react';

const Converter = () => {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [statusText, setStatusText] = useState('Ready');
  const [fileName, setFileName] = useState('');
  const [apiError, setApiError] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);

  // --- NEW BACKEND & HISTORY STATE ---
  const [isBackendLoading, setIsBackendLoading] = useState(false);
  const [backendMessage, setBackendMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  // --- END NEW ---

  const utteranceRef = useRef(null);
  const fileInputRef = useRef(null);
  const synth = window.speechSynthesis;

  // *** IMPORTANT ***
  // You will get this URL from Railway AFTER you deploy
  const BACKEND_URL = "https://text-to-speech-app-production.up.railway.app";
  
  const loadVoices = useCallback(() => {
    // ... (same as before) ...
    if (!synth) {
      setApiError(true);
      setStatusText('Speech API not supported');
      return;
    }
    const availableVoices = synth.getVoices();
    setVoices(availableVoices);

    if (availableVoices.length > 0) {
      const defaultVoice = availableVoices.find((v) => v.default) || availableVoices[0];
      setSelectedVoice(defaultVoice);
    }
  }, [synth]);
  
  // --- NEW FUNCTION to fetch history ---
  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/history`);
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      // Don't show an aggressive alert, just log it
    } finally {
      setIsLoadingHistory(false);
    }
  }, [BACKEND_URL]); // Add BACKEND_URL to dependency array

  useEffect(() => {
    loadVoices();
    if (synth && synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
    // Fetch history when component mounts
    fetchHistory();
  }, [synth, loadVoices, fetchHistory]); // Add fetchHistory

  const handleFileChange = (event) => {
    // ... (same as before) ...
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setStatusText('Reading file...');
    const reader = new FileReader();

    reader.onload = (e) => {
      setText(e.target.result);
      setStatusText('File loaded');
    };

    reader.onerror = () => {
      setStatusText('Error reading file');
      setFileName('');
    };

    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSpeak = () => {
    // ... (same as before) ...
    if (apiError || !synth || !text.trim() || synth.speaking) return;
    synth.cancel();
    setBackendMessage(''); // Clear backend message

    const newUtterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = newUtterance;

    newUtterance.voice = selectedVoice;
    newUtterance.rate = rate;
    newUtterance.pitch = pitch;

    newUtterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setStatusText('Speaking');
    };

    newUtterance.onpause = () => {
      setIsPaused(true);
      setStatusText('Paused');
    };

    newUtterance.onresume = () => {
      setIsPaused(false);
      setStatusText('Speaking');
    };

    newUtterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setStatusText('Finished');
      attemptAudioGeneration();
    };

    newUtterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      setIsSpeaking(false);
      setIsPaused(false);
      setStatusText('Error');
    };

    synth.speak(newUtterance);
  };

  // --- UPDATED to fetch history on success ---
  const handlePremiumSpeak = async () => {
    if (!text.trim() || isBackendLoading || isSpeaking) return;

    setIsBackendLoading(true);
    setBackendMessage('');
    setStatusText('Connecting to backend...');
    synth.cancel(); // Stop browser speech

    try {
      const response = await fetch(`${BACKEND_URL}/api/premium-speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          voice: selectedVoice?.name || 'default',
          rate: rate,
          pitch: pitch
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Backend response:', data);
      setStatusText('Backend request successful');
      setBackendMessage(data.message);
      
      // --- NEW: Refresh history list ---
      fetchHistory(); 
      
    } catch (error) {
      console.error('Error connecting to backend:', error);
      setStatusText('Error connecting to backend');
      setBackendMessage('Error: Could not connect to the server.');
    } finally {
      setIsBackendLoading(false);
    }
  };

  const handlePause = () => {
    if (synth.speaking && !isPaused) synth.pause();
  };

  const handleResume = () => {
    if (synth.paused) synth.resume();
  };

  const handleStop = () => {
    if (synth.speaking) {
      synth.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setStatusText('Stopped');
      utteranceRef.current = null;
    }
  };

  const attemptAudioGeneration = () => {
    // ... (same as before) ...
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
    // ... (same as before) ...
    if (!audioBlob) return;
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'text-to-speech.wav';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const StatusIndicator = () => {
    let colorClass = 'bg-gray-400';
    if (isSpeaking && !isPaused) colorClass = 'bg-green-500 animate-pulse';
    if (isPaused) colorClass = 'bg-yellow-500';
    if (isBackendLoading) colorClass = 'bg-blue-500 animate-pulse';
    if (statusText === 'Error') colorClass = 'bg-red-500';

    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-lg">
        <div className={`w-4 h-4 rounded-full ${colorClass} transition-colors`}></div>
        <span className="text-gray-700 font-medium">{statusText}</span>
      </div>
    );
  };
  
  if (apiError) {
    // ... (same as before) ...
    return (
      <section id="converter" className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Browser Not Supported
            </h2>
            <p className="mt-2 text-gray-600">
              Your browser does not support the Web Speech API.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    // --- WRAP IN A FRAGMENT ---
    <>
      <section id="converter" className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl">
            <div className="mb-6">
              <label htmlFor="text-input" className="text-xl font-semibold text-gray-800 mb-3 block">
                Enter Your Text
              </label>
              <textarea
                id="text-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste your text here..."
                className="w-full min-h-[180px] p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              ></textarea>
              <div className="mt-3 flex flex-col sm:flex-row justify-between items-center gap-4">
                <button
                  onClick={triggerFileInput}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200"
                >
                  <UploadCloud className="w-5 h-5" />
                  Upload Text File
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".txt,.md"
                  className="hidden"
                />
                <span className="text-sm text-gray-500 truncate" title={fileName}>
                  {fileName || 'No file selected'}
                </span>
                <span className="text-sm text-gray-500 flex-shrink-0">
                  {text.length} characters
                </span>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="control-group">
                <label htmlFor="voice-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Voice
                </label>
                <select
                  id="voice-select"
                  value={selectedVoice ? voices.indexOf(selectedVoice) : ''}
                  onChange={(e) => setSelectedVoice(voices[e.target.value])}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={voices.length === 0}
                >
                  {voices.length === 0 ? (
                    <option>Loading voices...</option>
                  ) : (
                    voices.map((voice, index) => (
                      <option key={voice.name + index} value={index}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="control-group">
                <label htmlFor="rate-input" className="block text-sm font-medium text-gray-700 mb-1">
                  Speed: <span className="font-bold text-indigo-600">{rate.toFixed(1)}x</span>
                </label>
                <input
                  type="range" id="rate-input" min="0.5" max="2" value={rate} step="0.1"
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
              <div className="control-group">
                <label htmlFor="pitch-input" className="block text-sm font-medium text-gray-700 mb-1">
                  Pitch: <span className="font-bold text-indigo-600">{pitch.toFixed(1)}x</span>
                </label>
                <input
                  type="range" id="pitch-input" min="0.5" max="2" value={pitch} step="0.1"
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSpeak}
                  disabled={!text.trim() || isSpeaking || isBackendLoading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Play className="w-5 h-5" /> Speak
                </button>
                {/* --- UPDATED PREMIUM BUTTON --- */}
                <button
                  onClick={handlePremiumSpeak}
                  disabled={!text.trim() || isSpeaking || isBackendLoading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {isBackendLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Star className="w-5 h-5" />
                  )}
                  {isBackendLoading ? 'Saving...' : 'Premium Speak'}
                </button>
              </div>
              <StatusIndicator />
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={handlePause}
                  disabled={!isSpeaking || isPaused}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  <Pause className="w-5 h-5" /> Pause
                </button>
                <button
                  onClick={handleResume}
                  disabled={!isPaused}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  <RefreshCw className="w-5 h-5" /> Resume
                </button>
                <button
                  onClick={handleStop}
                  disabled={!isSpeaking && !isBackendLoading}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  <StopCircle className="w-5 h-5" /> Stop
                </button>
            </div>
            
            {/* --- NEW MESSAGE DISPLAY --- */}
            {backendMessage && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-medium">{backendMessage}</p>
              </div>
            )}

            <div className="mt-10 pt-6 border-t border-gray-200 text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Save Your Speech</h3>
              <button
                onClick={handleDownload}
                disabled={!audioBlob}
                className="flex items-center justify-center gap-2 px-5 py-2 mx-auto bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-green-300"
              >
                <Download className="w-5 h-5" /> Download Audio
              </button>
              <p className="mt-3 text-xs text-gray-500">
                Note: Download feature is experimental.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- NEW HISTORY SECTION --- */}
      <section id="history" className="pb-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-8 h-8 text-indigo-600" />
            <h2 className="text-3xl font-bold text-gray-900">
              Recent Requests
            </h2>
          </div>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              {isLoadingHistory ? (
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="ml-3 text-gray-500">Loading history...</p>
                </div>
              ) : history.length === 0 ? (
                <p className="text-center text-gray-500">
                  No premium requests have been made yet.
                </p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {history.map((item) => (
                    <li key={item._id} className="py-4">
                      <p className="text-base text-gray-800 font-medium truncate">
                        {item.text}
                      </p>
                      <div className="mt-2 flex justify-between text-sm text-gray-500">
                        <span>
                          Voice: <strong className="text-gray-700">{item.voice}</strong>
                        </span>
                        <span>
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Converter;