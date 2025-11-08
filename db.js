import { MongoClient, ServerApiVersion } from 'mongodb';
import 'dotenv/config';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable in .env');
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;

async function connectToDb() {
  if (db) {
    return db;
  }
  
  try {
    // Connect the client to the server
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("[MONGODB] Pinged your deployment. You successfully connected to MongoDB!");
    
    db = client.db("VoiceAloudApp"); // Get the database
    return db;
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1); // Exit if we can't connect
  }
}

export { connectToDb };