import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import React from "react";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  iconColor?: string;
}

export default function SummaryCard({
  title,
  value,
  icon: Icon,
  subtitle,
  iconColor = "text-primary",
}: SummaryCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-2.5 rounded-xl bg-primary/10 ${iconColor}`}>
            <Icon size={22} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
