import multer from "multer"
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use the project-local uploads folder (works on Windows and *nix)
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Keep original filename; you could add a unique suffix if desired
    cb(null, file.originalname);
  }
});

export const upload = multer({ storage: storage })