import {
  CheckCircle,
  Circle,
  Upload,
  Brain,
  BarChart3,
  Route,
} from "lucide-react";

interface StepProgressProps {
  completedSteps: string[];
  activeStep: string;
}

const steps = [
  {
    id: "upload",
    title: "Upload Data",
    description: "Upload CSV files",
    icon: Upload,
    stepCheck: "preprocess", // This step is complete when preprocessing is done
  },
  {
    id: "train",
    title: "Train Model",
    description: "Build AI model",
    icon: Brain,
    stepCheck: "train",
  },
  {
    id: "predict",
    title: "Predict",
    description: "Generate forecasts",
    icon: BarChart3,
    stepCheck: "predict",
  },
  {
    id: "routes",
    title: "Optimize Route",
    description: "Plan delivery routes",
    icon: Route,
    stepCheck: "route",
  },
];

export function StepProgress({
  completedSteps,
  activeStep,
}: StepProgressProps) {
  const getStepStatus = (step: any) => {
    if (completedSteps.includes(step.stepCheck)) return "completed";
    if (step.id === activeStep) return "active";
    return "pending";
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50">
      <h3 className="text-lg font-bold text-slate-800 mb-4">
        🚀 Workflow Progress
      </h3>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step);
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    status === "completed"
                      ? "bg-green-500 border-green-500 text-white shadow-lg"
                      : status === "active"
                        ? "bg-blue-500 border-blue-500 text-white shadow-lg pulse-glow"
                        : "bg-gray-100 border-gray-300 text-gray-400"
                  }`}
                >
                  {status === "completed" ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`text-xs font-medium ${
                      status === "completed" || status === "active"
                        ? "text-slate-700"
                        : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p
                    className={`text-xs ${
                      status === "completed" || status === "active"
                        ? "text-slate-500"
                        : "text-gray-400"
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`mx-4 h-0.5 w-16 transition-all duration-300 ${
                    completedSteps.includes(step.stepCheck)
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
