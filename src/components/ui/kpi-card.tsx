"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: "up" | "down";
  trendValue?: string;
}

const KPICard = ({ title, value, description, icon, trend, trendValue }: KPICardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
        {trend && trendValue && (
          <div className={cn(
            "text-xs mt-1",
            trend === "up" ? "text-green-600" : "text-red-600"
          )}>
            {trend === "up" ? "↑" : "↓"} {trendValue} from last month
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KPICard;