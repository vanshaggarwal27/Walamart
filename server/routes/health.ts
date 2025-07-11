import { RequestHandler } from "express";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

function checkPythonDependencies(): Promise<boolean> {
  return new Promise((resolve) => {
    const scriptPath = path.join(
      process.cwd(),
      "python",
      "check_dependencies.py",
    );

    // Check if the dependency check script exists
    if (!fs.existsSync(scriptPath)) {
      resolve(false);
      return;
    }

    const python = spawn("python3", [scriptPath], {
      cwd: process.cwd(),
    });

    python.on("close", (code) => {
      resolve(code === 0);
    });

    python.on("error", () => {
      resolve(false);
    });
  });
}

export const healthHandler: RequestHandler = async (req, res) => {
  try {
    const checks = {
      server: true,
      python: await checkPythonDependencies(),
      scripts: {
        preprocessing: fs.existsSync(
          path.join(process.cwd(), "python", "app.py"),
        ),
        training: fs.existsSync(path.join(process.cwd(), "python", "model.py")),
        prediction: fs.existsSync(
          path.join(process.cwd(), "python", "pred.py"),
        ),
        routing: fs.existsSync(path.join(process.cwd(), "python", "route.py")),
      },
      directories: {
        uploads: fs.existsSync(path.join(process.cwd(), "uploads")),
        pythonData: fs.existsSync(path.join(process.cwd(), "python", "data")),
        models: fs.existsSync(path.join(process.cwd(), "python", "models")),
      },
    };

    const allScriptsReady = Object.values(checks.scripts).every(Boolean);
    const allDirectoriesReady = Object.values(checks.directories).every(
      Boolean,
    );
    const systemReady =
      checks.server && checks.python && allScriptsReady && allDirectoriesReady;

    res.json({
      status: systemReady ? "healthy" : "warning",
      timestamp: new Date().toISOString(),
      system: "Walmart AI Forecasting Platform",
      version: "1.0.0",
      checks,
      ready: systemReady,
      message: systemReady
        ? "🚀 All systems operational! Ready for forecasting."
        : "⚠️ Some components need attention. Check the details above.",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Health check failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
