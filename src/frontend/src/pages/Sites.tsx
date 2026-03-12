import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Edit2, MapPin, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import type { Site } from "../backend";
import { LocationType } from "../backend";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";
import SiteForm from "../components/SiteForm";
import { useSyncBackend, useSyncSites } from "../hooks/useQueries";
import { computeLocationTotalValue, formatCurrency } from "../lib/calculations";
import { useMaterials, useMovements, useSites } from "../store/useStore";

function getSiteStockStatus(
  siteId: bigint,
  movements: ReturnType<typeof useMovements>,
  materials: ReturnType<typeof useMaterials>,
) {
  let hasLow = false;
  let hasOut = false;
  for (const mat of materials) {
    let totalIn = 0;
    let totalOut = 0;
    for (const m of movements) {
      if (m.materialId !== mat.id) continue;
      if (
        m.destination?.type === LocationType.site &&
        m.destination.id === siteId
      )
        totalIn += Number(m.quantity);
      if (m.source?.type === LocationType.site && m.source.id === siteId)
        totalOut += Number(m.quantity);
    }
    const avail = Math.max(0, totalIn - totalOut);
    if (avail === 0 && totalIn > 0) hasOut = true;
    else if (avail > 0 && avail < 10) hasLow = true;
  }
  return { hasLow, hasOut };
}

export default function Sites() {
  const sites = useSites();
  const movements = useMovements();
  const materials = useMaterials();
  const { isLoading } = useSyncSites();
  const { syncDeleteSite } = useSyncBackend();

  const [formOpen, setFormOpen] = useState(false);
  const [editSite, setEditSite] = useState<Site | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Site | undefined>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sites</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sites.length} site{sites.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditSite(undefined);
            setFormOpen(true);
          }}
        >
          <Plus size={16} className="mr-2" />
          Add Site
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {["s1", "s2", "s3"].map((k) => (
            <Skeleton key={k} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : sites.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl">
          <MapPin size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No sites yet</p>
          <p className="text-sm mt-1">Add your first site to get started</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => {
            const { hasLow, hasOut } = getSiteStockStatus(
              site.id,
              movements,
              materials,
            );
            return (
              <div
                key={site.id.toString()}
                className="bg-card border rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {site.name}
                    </h3>
                    {site.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin size={11} />
                        {site.location}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditSite(site);
                        setFormOpen(true);
                      }}
                    >
                      <Edit2 size={13} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(site)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {hasOut && (
                      <Badge variant="destructive" className="text-xs">
                        Out of Stock
                      </Badge>
                    )}
                    {hasLow && !hasOut && (
                      <Badge className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-100">
                        Low Stock
                      </Badge>
                    )}
                    {!hasOut && !hasLow && (
                      <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
                        {formatCurrency(
                          computeLocationTotalValue(
                            site.id,
                            LocationType.site,
                            movements,
                            materials,
                          ),
                        )}
                      </Badge>
                    )}
                  </div>
                  <Link
                    to="/sites/$siteId"
                    params={{ siteId: site.id.toString() }}
                    className="text-xs text-primary flex items-center gap-0.5 hover:underline"
                  >
                    View <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SiteForm open={formOpen} onOpenChange={setFormOpen} site={editSite} />
      {deleteTarget && (
        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(undefined)}
          itemName={deleteTarget.name}
          onConfirm={() => syncDeleteSite(deleteTarget.id)}
        />
      )}
    </div>
  );
}
