import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { BarChart3, Package } from "lucide-react";
import React, { useMemo } from "react";
import { useSyncMaterials } from "../hooks/useQueries";
import { computeMaterialOverview, formatCurrency } from "../lib/calculations";
import {
  useGodowns,
  useMaterials,
  useMovements,
  useSites,
} from "../store/useStore";

export default function MaterialsOverview() {
  const materials = useMaterials();
  const sites = useSites();
  const godowns = useGodowns();
  const movements = useMovements();
  const { isLoading } = useSyncMaterials();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Stock Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track all materials across sites and godowns
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {["s1", "s2", "s3", "s4"].map((k) => (
            <Skeleton key={k} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl">
          <BarChart3 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No materials yet</p>
          <Link to="/materials">
            <Button variant="outline" className="mt-4">
              Go to Materials
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((material) => {
            const overview = computeMaterialOverview(
              material,
              movements,
              sites,
              godowns,
              [],
            );
            const {
              totalIn,
              totalOut,
              available,
              totalValue,
              locationBreakdown,
            } = overview;

            return (
              <div
                key={material.id.toString()}
                className="bg-card border rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Package size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-foreground">
                        {material.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {material.unit}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="text-green-700 font-medium">
                        IN: {totalIn}
                      </span>
                      <span className="text-orange-600 font-medium">
                        OUT: {totalOut}
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          available > 5
                            ? "text-green-700"
                            : available > 0
                              ? "text-amber-600"
                              : "text-amber-600",
                        )}
                      >
                        Available: {available}
                      </span>
                      {totalValue > 0 && (
                        <span className="text-green-700 font-medium">
                          Value: {formatCurrency(totalValue)}
                        </span>
                      )}
                      <span>
                        {locationBreakdown.length} location
                        {locationBreakdown.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <Link
                    to="/materials-overview/$materialId"
                    params={{ materialId: material.id.toString() }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
                    >
                      <BarChart3 size={14} />
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
