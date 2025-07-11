import { RequestHandler } from "express";
import path from "path";
import fs from "fs";

export const exportPredictionsHandler: RequestHandler = async (req, res) => {
  try {
    res.json({
      status: "success",
      message: "Predictions export functionality coming soon",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Predictions export failed",
    });
  }
};

export const exportRoutesHandler: RequestHandler = async (req, res) => {
  try {
    res.json({
      status: "success",
      message: "Routes export functionality coming soon",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Routes export failed",
    });
  }
};

export const exportMapHandler: RequestHandler = async (req, res) => {
  try {
    // Try multiple map file locations
    const mapPaths = [
      path.join(
        process.cwd(),
        "python",
        "data",
        "processed",
        "delivery_route_maptiler_osrm_co2.html",
      ),
      path.join(
        process.cwd(),
        "python",
        "data",
        "processed",
        "delivery_route_simple.html",
      ),
    ];

    let mapPath = null;
    for (const testPath of mapPaths) {
      if (fs.existsSync(testPath)) {
        mapPath = testPath;
        break;
      }
    }

    if (!mapPath) {
      return res.status(404).json({
        status: "error",
        message: "No map file found. Please generate a route first.",
      });
    }

    // Send file for download
    res.download(mapPath, "delivery_route_map.html", (err) => {
      if (err) {
        console.error("Map download error:", err);
        if (!res.headersSent) {
          res.status(500).json({
            status: "error",
            message: "Failed to download map",
          });
        }
      }
    });
  } catch (error) {
    console.error("Map export error:", error);
    res.status(500).json({
      status: "error",
      message: "Map export failed",
    });
  }
};
