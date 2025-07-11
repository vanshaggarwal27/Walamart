import React, { useState } from "react";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface FileStatus {
  name: string;
  uploaded: boolean;
  valid: boolean;
  size?: string;
  file?: File;
}

interface ModelMetrics {
  rmse: number;
  mae: number;
  accuracy: number;
}

interface ProcessingLogs {
  status: string;
  message: string;
  timestamp: string;
}

interface DataUploadSectionProps {
  onStepComplete: (step: string) => void;
  completedSteps: string[];
  uploadedFiles: FileStatus[];
  onFileUpload: (fileName: string, file: File) => void;
  isPreprocessing: boolean;
  setIsPreprocessing: (value: boolean) => void;
  preprocessingComplete: boolean;
  setPreprocessingComplete: (value: boolean) => void;
}

export function DataUploadSection({
  onStepComplete,
  completedSteps,
  uploadedFiles,
  onFileUpload,
  isPreprocessing,
  setIsPreprocessing,
  preprocessingComplete,
  setPreprocessingComplete,
}: DataUploadSectionProps) {
  const [preprocessingLogs, setPreprocessingLogs] = useState<ProcessingLogs[]>(
    [],
  );

  // Auto-detect preprocessing completion and mark upload step as complete
  React.useEffect(() => {
    if (preprocessingComplete && !completedSteps.includes("preprocess")) {
      onStepComplete("preprocess");
    }
  }, [preprocessingComplete, completedSteps, onStepComplete]);

  const handleFileUpload = (fileName: string, file: File) => {
    // Validate CSV file
    if (!file.name.endsWith(".csv")) {
      alert("Please upload a valid CSV file");
      return;
    }

    onFileUpload(fileName, file);
  };

  const handlePreprocessData = async () => {
    if (!allFilesUploaded) return;

    setIsPreprocessing(true);
    setPreprocessingLogs([]);

    try {
      const formData = new FormData();
      uploadedFiles.forEach((file) => {
        if (file.file) {
          formData.append(file.name, file.file);
        }
      });

      // Add log entry
      setPreprocessingLogs((prev) => [
        ...prev,
        {
          status: "info",
          message: "Starting data preprocessing...",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      const response = await fetch("/api/preprocess", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setPreprocessingLogs((prev) => [
          ...prev,
          {
            status: "success",
            message: `Data preprocessing completed!`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        setPreprocessingComplete(true);
        onStepComplete("preprocess");
      } else {
        throw new Error("Preprocessing failed");
      }
    } catch (error) {
      setPreprocessingLogs((prev) => [
        ...prev,
        {
          status: "error",
          message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsPreprocessing(false);
    }
  };

  const allFilesUploaded = uploadedFiles.every((f) => f.uploaded && f.valid);

  return (
    <div className="space-y-8 animate-slide-in-left">
      <div className="flex items-center justify-between">
        <div className="relative">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            🚀 Data Upload & AI Training
          </h1>
          <div className="absolute -top-2 -left-2 w-full h-full bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg -z-10 blur-sm opacity-30"></div>
          <p className="text-slate-600 mt-2 text-lg">
            Upload your CSV files and unleash the power of AI forecasting
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* File Upload Section */}
        <Card className="glass-card shadow-2xl hover:shadow-3xl transition-all duration-500 border-2 border-white/30 hover:border-blue-300/50 neon-glow">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-500 rounded-lg text-white shadow-lg">
                <Upload className="h-5 w-5" />
              </div>
              📁 Upload Data Files
            </CardTitle>
            <CardDescription className="text-slate-600 font-medium">
              Upload the required CSV files for AI model training
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadedFiles.map((file, index) => (
              <div
                key={file.name}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border-2 border-gradient-to-r from-blue-200 to-purple-200 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 -z-10"></div>
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white shadow-lg flex-shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 truncate">
                      {file.name}
                    </p>
                    {file.size && (
                      <p className="text-sm text-slate-600 font-medium">
                        📊 {file.size}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {file.uploaded ? (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800 border-green-200 whitespace-nowrap"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Uploaded
                    </Badge>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        id={`file-${file.name}`}
                        onChange={(e) => {
                          const uploadedFile = e.target.files?.[0];
                          if (uploadedFile) {
                            handleFileUpload(file.name, uploadedFile);
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap bg-white/80 hover:bg-white border-blue-300 text-blue-700 hover:text-blue-800 font-medium"
                        onClick={() =>
                          document.getElementById(`file-${file.name}`)?.click()
                        }
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Model Training Section */}
        <Card className="glass-card shadow-2xl hover:shadow-3xl transition-all duration-500 border-2 border-white/30 hover:border-purple-300/50 neon-glow">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white shadow-lg">
                <BarChart3 className="h-5 w-5" />
              </div>
              ⚙️ Data Preprocessing
            </CardTitle>
            <CardDescription className="text-slate-600 font-medium">
              Process and clean your uploaded data files
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!allFilesUploaded && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-amber-800">
                  Upload all required files to start preprocessing
                </p>
              </div>
            )}

            <Button
              onClick={handlePreprocessData}
              disabled={!allFilesUploaded || isPreprocessing}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 neon-glow"
              size="lg"
            >
              {isPreprocessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  🔄 Preprocessing Data...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  ⚙️ Preprocess Data
                </div>
              )}
            </Button>

            {/* Processing Logs */}
            {preprocessingLogs.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto p-4 bg-slate-50 rounded-lg border">
                <h4 className="font-medium text-slate-700">Processing Logs:</h4>
                {preprocessingLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-slate-500 font-mono text-xs">
                      {log.timestamp}
                    </span>
                    <span
                      className={`
                      ${
                        log.status === "success"
                          ? "text-green-600"
                          : log.status === "error"
                            ? "text-red-600"
                            : "text-blue-600"
                      }
                    `}
                    >
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {preprocessingComplete && (
              <div className="space-y-4 p-6 rounded-xl bg-gradient-to-r from-green-400/20 to-emerald-400/20 border-2 border-green-300/50 backdrop-blur-sm animate-slide-in-right">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg text-white shadow-lg pulse-glow">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <p className="text-xl font-bold text-green-800">
                    🎉 Data Preprocessing Complete!
                  </p>
                </div>
                <p className="text-green-700">
                  Your data has been successfully processed and is ready for
                  model training.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
