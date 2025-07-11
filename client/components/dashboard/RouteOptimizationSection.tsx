import { useState } from "react";
import { Route, Truck, Gauge, MapPin, Leaf, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface RouteOptimizationSectionProps {
  onStepComplete: (step: string) => void;
  completedSteps: string[];
}

interface RouteSummary {
  total_distance: number;
  total_time: number;
  co2_emissions: number;
  stores_count: number;
  route_efficiency: number;
}

export function RouteOptimizationSection({
  onStepComplete,
  completedSteps,
}: RouteOptimizationSectionProps) {
  const [threshold, setThreshold] = useState([0.35]);
  const [topStores, setTopStores] = useState("5");
  const [isGenerating, setIsGenerating] = useState(false);
  const [routeGenerated, setRouteGenerated] = useState(false);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [mapHtml, setMapHtml] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const predictionsComplete = completedSteps.includes("predict");

  const handleGenerateRoute = async () => {
    if (!predictionsComplete) return;

    setIsGenerating(true);
    setError(null);

    try {
      console.log("Starting route generation...");
      const response = await fetch("/api/route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          demand_threshold: threshold[0],
          top_stores: parseInt(topStores),
        }),
      });

      const result = await response.json();
      console.log("Route API response:", result);

      if (response.ok && result.status === "success") {
        console.log("Route generation successful!");
        console.log("Full API result:", JSON.stringify(result, null, 2));

        // Set real route data - ensure stores_count is correct
        const storeCount =
          result.stores_count ||
          result.selected_stores?.length ||
          parseInt(topStores);
        console.log("Store count calculation:");
        console.log("- result.stores_count:", result.stores_count);
        console.log(
          "- result.selected_stores?.length:",
          result.selected_stores?.length,
        );
        console.log("- parseInt(topStores):", parseInt(topStores));
        console.log("- Final storeCount:", storeCount);

        const newSummary = {
          total_distance: result.total_distance || 0,
          total_time: result.total_time || 0,
          co2_emissions: result.co2_emissions || 0,
          stores_count: storeCount,
          route_efficiency: result.route_efficiency || 0,
        };

        console.log("Setting new route summary:", newSummary);

        // Clear first then set to force update
        setRouteSummary(null);
        setTimeout(() => {
          setRouteSummary(newSummary);
          console.log("Route summary updated:", newSummary);
        }, 50);

        // Set map URL to view the generated map
        setMapHtml("/api/map/view");
        setRouteGenerated(true);
        onStepComplete("route");

        // Force refresh
        setRefreshKey((prev) => prev + 1);

        console.log("Route data set successfully:", {
          distance: result.total_distance,
          time: result.total_time,
          emissions: result.co2_emissions,
          stores: result.stores_count,
          efficiency: result.route_efficiency,
        });
      } else {
        const errorMsg =
          result.message || result.error || "Route generation failed";
        console.error("Route generation failed:", errorMsg);

        // Add helpful suggestions for threshold errors
        let enhancedError = errorMsg;
        if (
          errorMsg.includes("No stores found") ||
          errorMsg.includes("too high")
        ) {
          enhancedError += `\n\n💡 Suggestion: Try lowering the demand threshold to 0.3-0.4 units. Your prediction data shows demands between 0.3-0.5 units.`;
        }

        setError(enhancedError);
        setIsGenerating(false);
        return;
      }
    } catch (error) {
      console.error("Route generation error:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setError(`Route generation failed: ${errorMsg}`);
      setIsGenerating(false);
      return;
    }

    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Route Optimization
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate optimal delivery routes based on demand predictions
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Error:</span>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Route Parameters
              </CardTitle>
              <CardDescription>
                Configure optimization parameters for route generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Demand Threshold: {threshold[0]} units</Label>
                <Slider
                  value={threshold}
                  onValueChange={setThreshold}
                  max={0.5}
                  min={0.1}
                  step={0.05}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Minimum predicted demand (units) required to include a store
                  in the route.
                  <br />
                  <span className="text-blue-600">
                    💡 Tip: Your predictions range from 0.3-0.5 units. Try
                    0.3-0.4 for best results.
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <Label>Number of Stores</Label>
                <Select value={topStores} onValueChange={setTopStores}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Top 3 Stores</SelectItem>
                    <SelectItem value="5">Top 5 Stores</SelectItem>
                    <SelectItem value="7">Top 7 Stores</SelectItem>
                    <SelectItem value="10">Top 10 Stores</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Maximum number of stores to include in the optimized route
                </p>
              </div>

              <Button
                onClick={handleGenerateRoute}
                disabled={!predictionsComplete || isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Route...
                  </>
                ) : (
                  <>
                    <Route className="mr-2 h-4 w-4" />
                    Generate Delivery Route
                  </>
                )}
              </Button>

              {!predictionsComplete && (
                <p className="text-sm text-amber-600 text-center">
                  Please generate predictions first to enable route optimization
                </p>
              )}
            </CardContent>
          </Card>

          {routeGenerated && routeSummary && (
            <Card key={`route-summary-${refreshKey}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Route Summary ({routeSummary.stores_count} stores)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-blue-50">
                    <div className="text-2xl font-bold text-blue-600">
                      {routeSummary.total_distance}
                    </div>
                    <div className="text-sm text-blue-700">
                      Total Distance (km)
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-green-50">
                    <div className="text-2xl font-bold text-green-600">
                      {routeSummary.total_time}
                    </div>
                    <div className="text-sm text-green-700">Time (hours)</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-orange-50">
                    <div className="text-2xl font-bold text-orange-600">
                      {routeSummary.co2_emissions}
                    </div>
                    <div className="text-sm text-orange-700">
                      CO₂ Emissions (kg)
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-purple-50">
                    <div className="text-2xl font-bold text-purple-600">
                      {routeSummary.stores_count}
                    </div>
                    <div className="text-sm text-purple-700">
                      Stores (API: {routeSummary.stores_count})
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Optimization Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Predictions</span>
                <span
                  className={`text-sm font-medium ${
                    predictionsComplete ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {predictionsComplete ? "✓ Complete" : "Pending"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Route Generation</span>
                <span
                  className={`text-sm font-medium ${
                    routeGenerated ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {routeGenerated ? "✓ Complete" : "Pending"}
                </span>
              </div>
            </CardContent>
          </Card>

          {routeGenerated && routeSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5" />
                  Environmental Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Route Efficiency
                  </span>
                  <span className="font-medium">
                    {routeSummary.route_efficiency}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    CO₂ per km
                  </span>
                  <span className="font-medium">0.27 kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Emissions
                  </span>
                  <span className="font-medium">
                    {routeSummary.co2_emissions} kg
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
