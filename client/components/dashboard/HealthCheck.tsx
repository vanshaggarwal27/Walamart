import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HealthStatus {
  status: string;
  system: string;
  version: string;
  ready: boolean;
  checks: {
    server: boolean;
    python: boolean;
    scripts: {
      preprocessing: boolean;
      training: boolean;
      prediction: boolean;
      routing: boolean;
    };
    directories: {
      uploads: boolean;
      pythonData: boolean;
      models: boolean;
    };
  };
  message: string;
}

export function HealthCheck() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/health");
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error("Health check failed:", error);
      setHealth({
        status: "error",
        system: "Unknown",
        version: "Unknown",
        ready: false,
        checks: {
          server: false,
          python: false,
          scripts: {
            preprocessing: false,
            training: false,
            prediction: false,
            routing: false,
          },
          directories: {
            uploads: false,
            pythonData: false,
            models: false,
          },
        },
        message: "Health check failed",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  if (!health) return null;

  return (
    <Card className="mb-6 glass-card border-2 border-white/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {health.ready ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            <span>System Status</span>
          </div>
          <Button
            onClick={checkHealth}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                health.checks.server ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span>Server</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                health.checks.python ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span>Python</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                Object.values(health.checks.scripts).every(Boolean)
                  ? "bg-green-500"
                  : "bg-yellow-500"
              }`}
            />
            <span>ML Scripts</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                Object.values(health.checks.directories).every(Boolean)
                  ? "bg-green-500"
                  : "bg-yellow-500"
              }`}
            />
            <span>Directories</span>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-600">{health.message}</p>
      </CardContent>
    </Card>
  );
}
