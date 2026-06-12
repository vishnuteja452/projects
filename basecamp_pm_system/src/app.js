import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()
// basic configurations
app.use(express.json({limit :"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static(path.join(__dirname, "../public")))
app.use(cookieParser())

// cors configurations
const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [];
const localOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8000"
];
const corsOrigins = [...new Set([...allowedOrigins, ...localOrigins])];

app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["content-type", "authorization"],
}));

// import the routes

import healthcheck_router from "./routes/healthcheck_routes.js";
import authrouter from "./routes/authroute.js";
import projectrouter from "./routes/project_routes.js";
app.use("/api/v1/healthcheck",healthcheck_router);
app.use("/api/v1/auth",authrouter);
// proper project router mounting
app.use('/api/v1/projects', projectrouter);
app.get("/insight",(req,res) =>{
    res.send("this is a insight page ")
})
// Global error handler – always returns JSON
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal server error";
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || [],
    });
});

export default app;