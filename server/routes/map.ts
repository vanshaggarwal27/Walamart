import { RequestHandler } from "express";
import path from "path";
import fs from "fs";

export const serveMapHandler: RequestHandler = async (req, res) => {
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
        console.log(`Found map file: ${mapPath}`);
        break;
      }
    }

    // Check if map file exists
    if (!mapPath) {
      return res.status(404).json({
        status: "error",
        message: "Map file not found. Please generate a route first.",
      });
    }

    // Read and serve the HTML file
    const mapContent = fs.readFileSync(mapPath, "utf8");
    res.setHeader("Content-Type", "text/html");
    res.send(mapContent);
  } catch (error) {
    console.error("Map serving error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to serve map",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getMapDataHandler: RequestHandler = async (req, res) => {
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
    let mapStats = null;

    for (const testPath of mapPaths) {
      if (fs.existsSync(testPath)) {
        mapPath = testPath;
        mapStats = fs.statSync(testPath);
        break;
      }
    }

    // Check if map file exists
    if (!mapPath) {
      return res.json({
        status: "not_found",
        message: "No map available. Generate a route first.",
        hasMap: false,
      });
    }

    res.json({
      status: "success",
      message: "Map is available",
      hasMap: true,
      mapUrl: "/api/map/view",
      lastGenerated: mapStats.mtime.toISOString(),
    });
  } catch (error) {
    console.error("Map data error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get map data",
      hasMap: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
