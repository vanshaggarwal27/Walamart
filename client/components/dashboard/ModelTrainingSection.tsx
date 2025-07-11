import React, { useState, useEffect } from "react";
import { Brain, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ModelMetrics {
  rmse: number;
  mae: number;
  r2_score: number;
  training_time: string;
}

interface ModelTrainingSectionProps {
  onStepComplete: (step: string) => void;
  completedSteps: string[];
}

export function ModelTrainingSection({
  onStepComplete,
  completedSteps,
}: ModelTrainingSectionProps) {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [modelTrained, setModelTrained] = useState(false);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);

  const preprocessingComplete = completedSteps.includes("preprocess");

  useEffect(() => {
    if (modelTrained && !completedSteps.includes("train")) {
      onStepComplete("train");
    }
  }, [modelTrained, completedSteps, onStepComplete]);

  const handleTrainModel = async () => {
    if (!preprocessingComplete) return;

    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingLogs([]);
    setModelTrained(false);
    setModelMetrics(null);

    try {
      setTrainingLogs((prev) => [...prev, "🚀 Starting model training..."]);

      const response = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Training failed");

      const progressInterval = setInterval(() => {
        setTrainingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return Math.min(prev + Math.random() * 10, 90);
        });
      }, 500);

      setTrainingLogs((prev) => [...prev, "📊 Loading training data..."]);
      setTimeout(() => {
        setTrainingLogs((prev) => [...prev, "🤖 Training LightGBM model..."]);
      }, 1000);
      setTimeout(() => {
        setTrainingLogs((prev) => [
          ...prev,
          "📈 Validating model performance...",
        ]);
      }, 2000);

      const result = await response.json();
      clearInterval(progressInterval);
      setTrainingProgress(100);

      setModelMetrics({
        rmse: result.rmse,
        mae: result.mae,
        r2_score: result.r2_score,
        training_time: result.training_time,
      });
      

      setTrainingLogs((prev) => [
        ...prev,
        "✅ Model training completed successfully!",
      ]);
      setModelTrained(true);
    } catch (error) {
      setTrainingLogs((prev) => [
        ...prev,
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      ]);
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="space-y-8 animate-slide-in-left">
      <div className="flex items-center justify-between">
        <div className="relative">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            🧠 AI Model Training
          </h1>
          <div className="absolute -top-2 -left-2 w-full h-full bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg -z-10 blur-sm opacity-30"></div>
          <p className="text-slate-600 mt-2 text-lg">
            Train a powerful LightGBM model on your preprocessed data
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Training Panel */}
        <Card className="glass-card shadow-2xl border-2 border-white/30 hover:border-purple-300/50 neon-glow">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white shadow-lg">
                <Brain className="h-5 w-5" />
              </div>
              🚀 Model Training
            </CardTitle>
            <CardDescription className="text-slate-600 font-medium">
              Train LightGBM regression model for demand forecasting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!preprocessingComplete && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-amber-800">
                  Complete data preprocessing first
                </p>
              </div>
            )}

            <Button
              onClick={handleTrainModel}
              disabled={!preprocessingComplete || isTraining}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold shadow-xl transition-all duration-300 hover:scale-105 neon-glow"
              size="lg"
            >
              {isTraining ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  🤖 Training Model...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  🧠 Train Forecasting Model
                </div>
              )}
            </Button>

            {isTraining && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Training Progress</span>
                  <span className="font-bold">
                    {Math.round(trainingProgress)}%
                  </span>
                </div>
                <Progress value={trainingProgress} className="h-3" />
              </div>
            )}

            {trainingLogs.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto p-4 bg-slate-50 rounded-lg border">
                <h4 className="font-medium text-slate-700">Training Logs:</h4>
                {trainingLogs.map((log, idx) => (
                  <div key={idx} className="text-sm text-slate-600">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metrics Display */}
        <Card className="glass-card shadow-2xl border-2 border-white/30 hover:border-green-300/50 neon-glow">
          <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white shadow-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
              📊 Model Performance
            </CardTitle>
            <CardDescription className="text-slate-600 font-medium">
              Validation metrics and performance statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {modelTrained && modelMetrics ? (
              <div className="space-y-4 p-6 rounded-xl bg-gradient-to-r from-green-400/20 to-emerald-400/20 border-2 border-green-300/50 backdrop-blur-sm animate-slide-in-right">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg text-white shadow-lg pulse-glow">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <p className="text-xl font-bold text-green-800">
                    🎉 Model Training Complete!
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <MetricCard label="📊 RMSE" value={modelMetrics.rmse} />
                  <MetricCard label="📈 MAE" value={modelMetrics.mae} />
                  <MetricCard
                    label="🎯 R² Score"
                    value={`${(modelMetrics.r2_score * 100).toFixed(1)}%`}
                  />
                  <MetricCard
                    label="⏱️ Training Time"
                    value={modelMetrics.training_time}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Brain className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground mb-2">
                  No model trained yet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Start model training to see performance metrics
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 hover:scale-105 transition-transform shadow-lg">
      <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
        {value}
      </p>
      <p className="text-sm text-green-700 font-semibold">{label}</p>
    </div>
  );
}
