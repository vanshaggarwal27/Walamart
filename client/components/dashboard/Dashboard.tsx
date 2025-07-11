import { useState } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { StepProgress } from "./StepProgress";
import { SystemOverview } from "./SystemOverview";
import { DataUploadSection } from "./DataUploadSection";
import { ModelTrainingSection } from "./ModelTrainingSection";
import { SalesPredictionSection } from "./SalesPredictionSection";
import { RouteOptimizationSection } from "./RouteOptimizationSection";
import { MapDisplaySection } from "./MapDisplaySection";
import { DownloadExportSection } from "./DownloadExportSection";
import { HealthCheck } from "./HealthCheck";

interface FileStatus {
  name: string;
  uploaded: boolean;
  valid: boolean;
  size?: string;
  file?: File;
}

export function Dashboard() {
  const [activeSection, setActiveSection] = useState("upload");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Persistent state to prevent stopping background processes
  const [backgroundProcesses, setBackgroundProcesses] = useState<{
    [key: string]: boolean;
  }>({});

  // Persistent state for uploaded files
  const [uploadedFiles, setUploadedFiles] = useState<FileStatus[]>([
    { name: "sales_train_validation.csv", uploaded: false, valid: false },
    { name: "calendar.csv", uploaded: false, valid: false },
    { name: "sell_prices.csv", uploaded: false, valid: false },
  ]);

  // Persistent processing states
  const [isPreprocessing, setIsPreprocessing] = useState(false);
  const [preprocessingComplete, setPreprocessingComplete] = useState(false);

  const handleStepComplete = (step: string) => {
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  };

  const handleFileUpload = (fileName: string, file: File) => {
    setUploadedFiles((prev) =>
      prev.map((f) =>
        f.name === fileName
          ? {
              ...f,
              uploaded: true,
              valid: true,
              size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
              file: file,
            }
          : f,
      ),
    );
  };

  const renderSection = () => {
    console.log(
      "Rendering section:",
      activeSection,
      "Completed steps:",
      completedSteps,
    );

    try {
      switch (activeSection) {
        case "upload":
          return (
            <DataUploadSection
              onStepComplete={handleStepComplete}
              completedSteps={completedSteps}
              uploadedFiles={uploadedFiles}
              onFileUpload={handleFileUpload}
              isPreprocessing={isPreprocessing}
              setIsPreprocessing={setIsPreprocessing}
              preprocessingComplete={preprocessingComplete}
              setPreprocessingComplete={setPreprocessingComplete}
            />
          );
        case "train":
          return (
            <ModelTrainingSection
              onStepComplete={handleStepComplete}
              completedSteps={completedSteps}
            />
          );
        case "predict":
          return (
            <SalesPredictionSection
              onStepComplete={handleStepComplete}
              completedSteps={completedSteps}
            />
          );
        case "routes":
          return (
            <RouteOptimizationSection
              onStepComplete={handleStepComplete}
              completedSteps={completedSteps}
            />
          );
        case "map":
          return <MapDisplaySection />;
        case "download":
          return <DownloadExportSection completedSteps={completedSteps} />;
        default:
          return (
            <DataUploadSection
              onStepComplete={handleStepComplete}
              completedSteps={completedSteps}
              uploadedFiles={uploadedFiles}
              onFileUpload={handleFileUpload}
              isPreprocessing={isPreprocessing}
              setIsPreprocessing={setIsPreprocessing}
              preprocessingComplete={preprocessingComplete}
              setPreprocessingComplete={setPreprocessingComplete}
            />
          );
      }
    } catch (error) {
      console.error("Error rendering section:", error);
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">
              Section Loading Error
            </h2>
            <p className="text-gray-600 mb-2">
              Current section: {activeSection}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
            <button
              onClick={() => setActiveSection("upload")}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Return to Upload
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          completedSteps={completedSteps}
        />
        <SidebarInset className="flex-1 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
          <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center gap-4 border-b border-white/20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 backdrop-blur-md px-6 shadow-xl">
            <SidebarTrigger className="md:hidden text-white hover:bg-white/20 rounded-lg" />
            <div className="flex items-center gap-4 flex-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-white shadow-lg pulse-glow float-animation">
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                  Walmart AI Forecasting Platform
                </h1>
                <p className="text-sm text-white/80 hidden sm:block font-medium">
                  🚀 Next-Gen Route Optimization & Demand Intelligence
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">
                  Live System
                </span>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">
            <HealthCheck />
            <SystemOverview completedSteps={completedSteps} />
            <div className="mb-8">
              <StepProgress
                completedSteps={completedSteps}
                activeStep={activeSection}
              />
            </div>
            {renderSection()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
