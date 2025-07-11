import { Database, Cpu, TrendingUp, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SystemOverviewProps {
  completedSteps: string[];
}

export function SystemOverview({ completedSteps }: SystemOverviewProps) {
  const stats = [
    {
      title: "Data Status",
      value: completedSteps.includes("preprocess") ? "Processed" : "Pending",
      icon: Database,
      color: completedSteps.includes("preprocess")
        ? "text-green-600"
        : "text-gray-400",
      bgColor: completedSteps.includes("preprocess")
        ? "bg-green-100"
        : "bg-gray-100",
    },
    {
      title: "Model Status",
      value: completedSteps.includes("train") ? "Trained" : "Not Trained",
      icon: Cpu,
      color: completedSteps.includes("train")
        ? "text-blue-600"
        : "text-gray-400",
      bgColor: completedSteps.includes("train") ? "bg-blue-100" : "bg-gray-100",
    },
    {
      title: "Predictions",
      value: completedSteps.includes("predict") ? "Generated" : "Pending",
      icon: TrendingUp,
      color: completedSteps.includes("predict")
        ? "text-purple-600"
        : "text-gray-400",
      bgColor: completedSteps.includes("predict")
        ? "bg-purple-100"
        : "bg-gray-100",
    },
    {
      title: "Route",
      value: completedSteps.includes("route") ? "Optimized" : "Pending",
      icon: MapPin,
      color: completedSteps.includes("route")
        ? "text-orange-600"
        : "text-gray-400",
      bgColor: completedSteps.includes("route")
        ? "bg-orange-100"
        : "bg-gray-100",
    },
  ];

  const completionPercentage = (completedSteps.length / 4) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className="glass-card border-2 border-white/30 hover:shadow-lg transition-all duration-300"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {stat.title}
                  </p>
                  <p className={`text-lg font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
