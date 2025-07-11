import { RequestHandler } from "express";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

function executePythonScript(
  scriptPath: string,
  args: string[] = [],
): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log(
      `Spawning Python process: python3 ${scriptPath} ${args.join(" ")}`,
    );

    const python = spawn("python3", [scriptPath, ...args], {
      cwd: process.cwd(),
      env: { ...process.env, PYTHONPATH: process.cwd() },
    });

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
      const output = data.toString();
      stdout += output;
      console.log("Python stdout:", output.trim());
    });

    python.stderr.on("data", (data) => {
      const error = data.toString();
      stderr += error;
      console.error("Python stderr:", error.trim());
    });

    python.on("close", (code) => {
      console.log(`Python process closed with code: ${code}`);
      console.log("Full stdout:", stdout);
      console.log("Full stderr:", stderr);

      if (code === 0) {
        try {
          const lines = stdout.trim().split("\n");
          const lastLine = lines[lines.length - 1];
          console.log("Attempting to parse last line:", lastLine);
          const result = JSON.parse(lastLine);
          resolve(result);
        } catch (e) {
          console.log("JSON parse failed, returning raw output");
          resolve({ status: "success", message: stdout });
        }
      } else {
        reject(new Error(`Python script failed with code ${code}: ${stderr}`));
      }
    });

    python.on("error", (error) => {
      console.error("Python spawn error:", error);
      reject(error);
    });
  });
}

export const trainHandler: RequestHandler = async (req, res) => {
  try {
    console.log("=== Starting model training ===");

    // Check script path
    const scriptPath = path.join(process.cwd(), "python", "model.py");
    console.log("Script path:", scriptPath);
    console.log("Current working directory:", process.cwd());

    // Check if file exists
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Python script not found at: ${scriptPath}`);
    }
    console.log("✓ Python script found");

    // Check if processed data exists
    const dataPath = path.join(
      process.cwd(),
      "python",
      "data",
      "processed",
      "m5_preprocessed_sample.csv",
    );
    if (!fs.existsSync(dataPath)) {
      throw new Error(
        `Processed data not found at: ${dataPath}. Please run preprocessing first.`,
      );
    }
    console.log("✓ Processed data found");

    console.log("Executing Python script...");
    const result = await executePythonScript(scriptPath);
    console.log("✓ Python script completed successfully");

    res.json(result);
  } catch (error) {
    console.error("=== Training error ===");
    console.error("Error details:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error message:", errorMessage);

    res.status(500).json({
      status: "error",
      message: "Model training failed",
      error: errorMessage,
      debug: {
        scriptPath: path.join(process.cwd(), "python", "model.py"),
        cwd: process.cwd(),
        timestamp: new Date().toISOString(),
      },
    });
  }
};
