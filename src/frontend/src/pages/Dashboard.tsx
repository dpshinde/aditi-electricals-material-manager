import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeftRight,
  Building2,
  MapPin,
  Package,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import React from "react";
import SummaryCard from "../components/SummaryCard";
import {
  useSyncCompanies,
  useSyncGodowns,
  useSyncMaterials,
  useSyncMovements,
  useSyncSites,
} from "../hooks/useQueries";
import {
  computeDashboardTotals,
  filterRealMovements,
  formatCurrency,
  formatMovementDate,
  getLocationName,
} from "../lib/calculations";
import {
  useCompanies,
  useGodowns,
  useMaterials,
  useMovements,
  useSites,
} from "../store/useStore";

export default function Dashboard() {
  const sites = useSites();
  const godowns = useGodowns();
  const companies = useCompanies();
  const materials = useMaterials();
  const movements = useMovements();

  const { isLoading: sitesLoading } = useSyncSites();
  const { isLoading: godownsLoading } = useSyncGodowns();
  const { isLoading: companiesLoading } = useSyncCompanies();
  const { isLoading: materialsLoading } = useSyncMaterials();
  const { isLoading: movementsLoading } = useSyncMovements();

  const isLoading =
    sitesLoading ||
    godownsLoading ||
    companiesLoading ||
    materialsLoading ||
    movementsLoading;

  const { totalStockValue } = computeDashboardTotals(movements, materials);

  const realMovements = filterRealMovements(movements);
  const recentMovements = [...realMovements]
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of Aditi Electricals material management
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {["s1", "s2", "s3", "s4", "s5", "s6"].map((k) => (
            <Skeleton key={k} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <SummaryCard title="Total Sites" value={sites.length} icon={MapPin} />
          <SummaryCard
            title="Total Godowns"
            value={godowns.length}
            icon={Warehouse}
          />
          <SummaryCard
            title="Companies"
            value={companies.length}
            icon={Building2}
          />
          <SummaryCard
            title="Materials"
            value={materials.length}
            icon={Package}
          />
          <SummaryCard
            title="Movements"
            value={realMovements.length}
            icon={ArrowLeftRight}
          />
          <SummaryCard
            title="Stock Value"
            value={formatCurrency(totalStockValue)}
            icon={TrendingUp}
            subtitle="Total inventory value"
          />
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Recent Movements
        </h2>
        {movementsLoading ? (
          <div className="space-y-2">
            {["m1", "m2", "m3", "m4", "m5"].map((k) => (
              <Skeleton key={k} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : recentMovements.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border rounded-xl">
            <ArrowLeftRight size={32} className="mx-auto mb-2 opacity-30" />
            <p>No movements yet</p>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden divide-y">
            {recentMovements.map((m) => {
              const mat = materials.find((x) => x.id === m.materialId);
              const from = getLocationName(m.source, sites, godowns, companies);
              const to = getLocationName(
                m.destination,
                sites,
                godowns,
                companies,
              );
              return (
                <div
                  key={m.id.toString()}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {mat?.name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {from} → {to}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-semibold text-foreground">
                      {m.quantity.toString()} {mat?.unit}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatMovementDate(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
