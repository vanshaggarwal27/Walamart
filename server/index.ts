import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { preprocessHandler, uploadMiddleware } from "./routes/preprocess";
import { trainHandler } from "./routes/train";
import { predictHandler } from "./routes/predict";
import { routeHandler } from "./routes/route";
import {
  exportPredictionsHandler,
  exportRoutesHandler,
  exportMapHandler,
} from "./routes/export";
import { healthHandler } from "./routes/health";
import { serveMapHandler, getMapDataHandler } from "./routes/map";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Walmart AI Forecasting Platform API v1.0" });
  });

  app.get("/api/health", healthHandler);
  app.get("/api/demo", handleDemo);

  // Walmart Forecasting Platform API endpoints
  app.post("/api/preprocess", uploadMiddleware, preprocessHandler);
  app.post("/api/train", trainHandler);
  app.post("/api/predict", predictHandler);
  app.post("/api/route", routeHandler);

  // Export endpoints
  app.get("/api/export/predictions", exportPredictionsHandler);
  app.get("/api/export/routes", exportRoutesHandler);
  app.get("/api/export/map", exportMapHandler);

  // Map endpoints
  app.get("/api/map/view", serveMapHandler);
  app.get("/api/map/data", getMapDataHandler);

  return app;
}
