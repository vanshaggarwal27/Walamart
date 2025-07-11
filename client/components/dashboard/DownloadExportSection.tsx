import {
  Download,
  FileText,
  FileImage,
  FileSpreadsheet,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DownloadExportSectionProps {
  completedSteps: string[];
}

export function DownloadExportSection({
  completedSteps,
}: DownloadExportSectionProps) {
  const exportOptions = [
    {
      title: "Prediction Results",
      description: "Export demand forecasting results as CSV",
      icon: FileSpreadsheet,
      format: "CSV",
      action: "download-predictions",
      requiredStep: "predict",
      endpoint: "/api/export/predictions",
    },
    {
      title: "Route Summary",
      description: "Export route optimization summary",
      icon: FileText,
      format: "CSV/PDF",
      action: "download-routes",
      requiredStep: "route",
      endpoint: "/api/export/routes",
    },
    {
      title: "Map Snapshot",
      description: "Export current map view as image",
      icon: FileImage,
      format: "PNG",
      action: "download-map",
      requiredStep: "route",
      endpoint: "/api/export/map",
    },
  ];

  const handleExport = async (action: string, endpoint: string) => {
    try {
      const response = await fetch(endpoint, {
        method: "GET",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `walmart_${action.replace("download-", "")}_${new Date().toISOString().split("T")[0]}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error(`Export failed for ${action}:`, error);
    }
  };

  return (
    <div className="space-y-8 animate-slide-in-left">
      <div className="flex items-center justify-between">
        <div className="relative">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            📥 Download & Export Hub
          </h1>
          <div className="absolute -top-2 -left-2 w-full h-full bg-gradient-to-r from-indigo-200 to-blue-200 rounded-lg -z-10 blur-sm opacity-30"></div>
          <p className="text-slate-600 mt-2 text-lg">
            Export your analysis results and stunning visualizations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exportOptions.map((option, index) => {
          const isAvailable = completedSteps.includes(option.requiredStep);
          return (
            <Card
              key={option.action}
              className={`glass-card shadow-2xl hover:shadow-3xl transition-all duration-500 border-2 border-white/30 relative overflow-hidden ${
                isAvailable
                  ? "hover:border-indigo-300/50 neon-glow"
                  : "opacity-60"
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 -z-10"></div>

              {isAvailable && (
                <div className="absolute top-2 right-2">
                  <div className="p-1 bg-green-500 rounded-full">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}

              <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div
                    className={`p-2 rounded-lg text-white shadow-lg ${
                      isAvailable
                        ? "bg-gradient-to-r from-indigo-500 to-blue-500"
                        : "bg-gray-400"
                    }`}
                  >
                    <option.icon className="h-5 w-5" />
                  </div>
                  {option.title}
                </CardTitle>
                <CardDescription className="text-slate-600 font-medium">
                  {option.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 font-medium">
                    Format:
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {option.format}
                  </span>
                </div>
                <Button
                  onClick={() => handleExport(option.action, option.endpoint)}
                  disabled={!isAvailable}
                  className={`w-full font-bold shadow-lg transition-all duration-300 ${
                    isAvailable
                      ? "bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white hover:scale-105 neon-glow"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  variant={isAvailable ? "default" : "outline"}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isAvailable
                    ? "Download"
                    : `Complete ${option.requiredStep} first`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="glass-card shadow-2xl border-2 border-white/30 neon-glow">
        <CardHeader className="bg-gradient-to-r from-slate-500/10 to-gray-500/10 rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-r from-slate-500 to-gray-500 rounded-lg text-white shadow-lg">
              <FileText className="h-5 w-5" />
            </div>
            📋 Export History
          </CardTitle>
          <CardDescription className="text-slate-600 font-medium">
            Recent downloads and export activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-gradient-to-r from-slate-100 to-gray-100 rounded-full mb-4">
              <FileText className="h-12 w-12 text-slate-500" />
            </div>
            <h3 className="font-bold text-slate-700 mb-2 text-lg">
              📊 No exports yet
            </h3>
            <p className="text-slate-600 font-medium">
              Your download history will appear here once you start exporting
              data
            </p>
            <div className="mt-4 text-xs text-slate-500">
              🔒 All exports are securely tracked and timestamped
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
