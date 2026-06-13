import { app } from "./src/app.js";
import connectDB from "./src/db/index.js";
import dotenv from "dotenv";

dotenv.config();

let isConnected = false;
const connectDbIfNeeded = async () => {
  if (isConnected) return;
  await connectDB();
  isConnected = true;
};

export default async function handler(req, res) {
  try {
    await connectDbIfNeeded();
    return app(req, res);
  } catch (error) {
    console.error("Database connection failed in serverless context:", error);
    res.status(500).json({ error: "Database connection failed" });
  }
}
