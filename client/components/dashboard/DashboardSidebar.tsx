import { Upload, Brain, BarChart3, Route, Map, Download } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Upload Data",
    icon: Upload,
    id: "upload",
  },
  {
    title: "Train Model",
    icon: Brain,
    id: "train",
  },
  {
    title: "Predict Demand",
    icon: BarChart3,
    id: "predict",
  },
  {
    title: "Plan Routes",
    icon: Route,
    id: "routes",
  },
  {
    title: "View Map",
    icon: Map,
    id: "map",
  },
  {
    title: "Download",
    icon: Download,
    id: "download",
  },
];

interface DashboardSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  completedSteps: string[];
}

export function DashboardSidebar({
  activeSection,
  onSectionChange,
  completedSteps,
}: DashboardSidebarProps) {
  return (
    <Sidebar className="gradient-bg">
      <SidebarHeader className="border-b border-white/20 bg-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-white shadow-lg pulse-glow">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-xl font-bold text-white drop-shadow-lg">
              Walmart
            </h2>
            <p className="text-sm text-white/80 font-medium">
              AI Forecasting Hub
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item, index) => {
                const isCompleted =
                  (item.id === "upload" &&
                    completedSteps.includes("preprocess")) ||
                  (item.id === "train" && completedSteps.includes("train")) ||
                  (item.id === "predict" &&
                    completedSteps.includes("predict")) ||
                  (item.id === "routes" && completedSteps.includes("route"));

                return (
                  <SidebarMenuItem
                    key={item.id}
                    className="animate-slide-in-left"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <SidebarMenuButton
                      onClick={() => onSectionChange(item.id)}
                      isActive={activeSection === item.id}
                      className={`w-full justify-start rounded-xl transition-all duration-300 relative ${
                        activeSection === item.id
                          ? "bg-white/25 text-white shadow-lg backdrop-blur-sm neon-glow"
                          : "text-white/80 hover:bg-white/15 hover:text-white hover:shadow-md hover:backdrop-blur-sm"
                      }`}
                      tooltip={item.title}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
