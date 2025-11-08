import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // Import dotenv to read .env file
import { connectToDb } from './db.js'; // Import our DB connection

// *** IMPORTANT ***
// This now matches your package.json homepage
const GITHUB_PAGES_URL = `https://Saketh-CSE.github.io/text-to-speech-app`; 

const corsOptions = {
  origin: [GITHUB_PAGES_URL, "http://localhost:5173"], // Allow your local dev and GitHub Pages
};

// Create our server
const app = express();
const PORT = process.env.PORT || 3001; // Use Railway's port or 3001

// Setup middleware
app.use(cors(corsOptions)); // Use our specific CORS options
app.use(express.json()); // Allow server to read JSON

// --- API ROUTES ---

// UPDATE this route to be async and save to DB
app.post('/api/premium-speak', async (req, res) => {
  try {
    const { text, voice, rate, pitch } = req.body;
    console.log('[BACKEND] Received request from:', req.headers.origin);
    console.log('[BACKEND] Text:', text);

    // Get the database connection
    const db = await connectToDb();
    const historyCollection = db.collection("history");

    // Create a new document
    const newRequest = {
      text,
      voice,
      rate,
      pitch,
      createdAt: new Date(),
    };

    // Save the document to the database
    const result = await historyCollection.insertOne(newRequest);
    console.log('[MONGODB] Saved request with id:', result.insertedId);

    // ... (Simulation code is the same) ...
    console.log('[BACKEND] Simulating AI voice generation...');
    setTimeout(() => {
      console.log('[BACKEND] Simulation complete.');
      res.json({
        message: "Premium audio generated and request saved!",
        audioUrl: "https://storage.googleapis.com/audio-samples/fake-audio.mp3",
        savedId: result.insertedId
      });
    }, 1500);

  } catch (err) {
    console.error("Error in /api/premium-speak:", err);
    res.status(500).json({ message: "Error processing request", error: err.message });
  }
});

// ADD this new route to get history
app.get('/api/history', async (req, res) => {
  try {
    const db = await connectToDb();
    const historyCollection = db.collection("history");
    
    // Find all documents, sort by newest first, limit to 20
    const history = await historyCollection.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
      
    res.json(history);
  } catch (err) {
    console.error("Error in /api/history:", err);
    res.status(500).json({ message: "Error fetching history", error: err.message });
  }
});


// Start the server (wrapped in a function to connect to DB first)
async function startServer() {
  try {
    await connectToDb(); // Ensure DB is connected before starting server
    app.listen(PORT, () => {
      console.log(`[BACKEND] Server is running on port: ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
}

startServer();