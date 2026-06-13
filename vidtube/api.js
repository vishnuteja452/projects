import "dotenv/config";
import connectDB from "./src/db/index.js";
import { app } from "./src/app.js";

// Connect MongoDB once per lambda execution container
let isConnected = false;
const connectDbIfNeeded = async () => {
  if (isConnected) return;
  await connectDB();
  isConnected = true;
};

export default async function handler(req, res) {
  try {
    await connectDbIfNeeded();
    // Forward the request to the Express application
    return app(req, res);
  } catch (error) {
    console.error("Database connection failed in serverless context:", error);
    res.status(500).json({ error: "Database connection failed" });
  }
}
