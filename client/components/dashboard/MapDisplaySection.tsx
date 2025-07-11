import { useState, useEffect } from "react";
import { MapPin, Navigation, Leaf, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MapData {
  status: string;
  message: string;
  hasMap: boolean;
  mapUrl?: string;
  lastGenerated?: string;
}

export function MapDisplaySection() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMapData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/map/data");
      const data = await response.json();
      setMapData(data);

      if (!data.hasMap) {
        setError(
          "No map available. Please generate a route first in the Route Optimization section.",
        );
      }
    } catch (err) {
      setError("Failed to check map availability");
      console.error("Map data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, []);

  const refreshMap = () => {
    fetchMapData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Interactive Route Map
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize optimized delivery routes and store locations
          </p>
        </div>
        <Button
          onClick={refreshMap}
          disabled={loading}
          variant="outline"
          className="gap-2"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh Map
        </Button>
      </div>

      {error && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-orange-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-[600px]">
            <CardContent className="p-0 h-full">
              {mapData?.hasMap ? (
                <iframe
                  src={mapData.mapUrl}
                  className="w-full h-full rounded-lg border-0"
                  title="Interactive Route Map"
                  style={{ minHeight: "600px" }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center bg-muted/50 rounded-lg p-6">
                  <MapPin className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    {loading ? "Loading Map..." : "No Route Map Available"}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {loading
                      ? "Checking for available route maps..."
                      : "Generate a delivery route in the Route Optimization section to view the interactive map here."}
                  </p>
                  {!loading && !mapData?.hasMap && (
                    <Button
                      onClick={refreshMap}
                      variant="outline"
                      className="mt-4"
                    >
                      Check Again
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Navigation className="h-5 w-5" />
                Map Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span
                  className={`font-medium ${
                    mapData?.hasMap ? "text-green-600" : "text-orange-600"
                  }`}
                >
                  {loading
                    ? "Loading..."
                    : mapData?.hasMap
                      ? "Available"
                      : "Not Available"}
                </span>
              </div>
              {mapData?.lastGenerated && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Last Generated
                  </span>
                  <span className="font-medium text-xs">
                    {new Date(mapData.lastGenerated).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Map Type</span>
                <span className="font-medium">Interactive HTML</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Leaf className="h-5 w-5" />
                Map Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">Store Locations</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Optimized Route</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Emission Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm">Route Summary</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={refreshMap}
                disabled={loading}
                variant="outline"
                className="w-full"
                size="sm"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh Map
              </Button>
              {mapData?.hasMap && (
                <Button
                  onClick={() => window.open(mapData.mapUrl, "_blank")}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
