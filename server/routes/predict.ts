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
      env: {
        ...process.env,
        PYTHONPATH: process.cwd(),
        PYTHONIOENCODING: "utf-8",
      },
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

export const predictHandler: RequestHandler = async (req, res) => {
  try {
    const { category, store, start_date, end_date } = req.body;

    console.log("=== Starting prediction generation ===");
    console.log("Prediction parameters:", {
      category,
      store,
      start_date,
      end_date,
    });

    // Check script path
    const scriptPath = path.join(process.cwd(), "python", "pred.py");
    console.log("Prediction script path:", scriptPath);
    console.log("Current working directory:", process.cwd());

    // Check if file exists
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Python prediction script not found at: ${scriptPath}`);
    }
    console.log("✓ Prediction script found");

    // Execute Python prediction script
    const params = JSON.stringify({ category, store, start_date, end_date });
    console.log("Parameters being passed to Python:", params);
    console.log("Executing Python prediction script...");

    const result = await executePythonScript(scriptPath, [params]);
    console.log("✓ Python prediction completed successfully");

    res.json(result);
  } catch (error) {
    console.error("=== Prediction error ===");
    console.error("Error details:", error);
    res.status(500).json({
      status: "error",
      message: "Prediction generation failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
