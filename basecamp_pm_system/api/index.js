import app from "../src/app.js";
import connectmongo from "../src/db/database.js";
import dotenv from "dotenv";

dotenv.config();

// Connect MongoDB once per serverless container
let isConnected = false;
const connectDbIfNeeded = async () => {
  if (isConnected) return;
  await connectmongo();
  isConnected = true;
};

export default async function handler(req, res) {
  try {
    await connectDbIfNeeded();
    return app(req, res);
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({ error: "Database connection failed" });
  }
}
