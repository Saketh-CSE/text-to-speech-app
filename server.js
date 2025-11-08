const express = require('express');
const cors = require('cors');

// Create our server
const app = express();
const PORT = 3001;

// Setup middleware
app.use(cors()); // Allow requests from our frontend
app.use(express.json()); // Allow server to read JSON

// This is our main API endpoint
app.post('/api/premium-speak', (req, res) => {
  // 1. Get the data from the React frontend
  const { text, voice, rate, pitch } = req.body;

  console.log('[BACKEND] Received request for premium voice.');
  console.log('[BACKEND] Text:', text);
  console.log('[BACKEND] Voice:', voice);

  // --- SIMULATION ---
  // In a real app, this is where you would send this data to a
  // paid service like Google Cloud Text-to-Speech or Amazon Polly
  // to generate a real audio file.
  
  // We'll simulate a 1.5 second delay
  console.log('[BACKEND] Simulating AI voice generation...');
  setTimeout(() => {
    console.log('[BACKEND] Simulation complete. Sending (fake) URL back.');
    
    // 2. Send a response back to React
    res.json({
      message: "Premium audio generated! (Simulated)",
      audioUrl: "https://storage.googleapis.com/audio-samples/fake-audio.mp3"
    });
  }, 1500);
});

// Start the server
app.listen(PORT, () => {
  console.log(`[BACKEND] Server is running on http://localhost:${PORT}`);
});