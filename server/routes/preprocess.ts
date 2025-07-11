import { RequestHandler } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

function executePythonScript(
  scriptPath: string,
  args: string[] = [],
): Promise<any> {
  return new Promise((resolve, reject) => {
    const python = spawn("python", [scriptPath, ...args], {
      cwd: process.cwd(),
    });

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    python.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    python.on("close", (code) => {
      if (code === 0) {
        try {
          // Try to parse the last line as JSON (our script output)
          const lines = stdout.trim().split("\n");
          const lastLine = lines[lines.length - 1];
          const result = JSON.parse(lastLine);
          resolve(result);
        } catch (e) {
          // If JSON parsing fails, return raw output
          resolve({ status: "success", message: stdout });
        }
      } else {
        reject(new Error(`Python script failed with code ${code}: ${stderr}`));
      }
    });

    python.on("error", (error) => {
      reject(error);
    });
  });
}

export const preprocessHandler: RequestHandler = async (req, res) => {
  try {
    console.log("Starting data preprocessing...");

    // Execute Python preprocessing script
    const scriptPath = path.join(process.cwd(), "python", "app.py");
    const result = await executePythonScript(scriptPath);

    res.json(result);
  } catch (error) {
    console.error("Preprocessing error:", error);
    res.status(500).json({
      status: "error",
      message: "Data preprocessing failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const uploadMiddleware = upload.fields([
  { name: "sales_train_validation.csv", maxCount: 1 },
  { name: "calendar.csv", maxCount: 1 },
  { name: "sell_prices.csv", maxCount: 1 },
]);
