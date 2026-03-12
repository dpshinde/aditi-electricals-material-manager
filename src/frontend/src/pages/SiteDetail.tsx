import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import React, { useState } from "react";
import { LocationType } from "../backend";
import LocationMaterialForm from "../components/LocationMaterialForm";
import MovementForm from "../components/MovementForm";
import { useSyncMovements } from "../hooks/useQueries";
import {
  computeLocationStock,
  formatCurrency,
  formatMovementDateTime,
  getLocationName,
} from "../lib/calculations";
import {
  useCompanies,
  useGodowns,
  useMaterials,
  useMovements,
  useSites,
} from "../store/useStore";

export default function SiteDetail() {
  const { siteId } = useParams({ from: "/sites/$siteId" });
  const sites = useSites();
  const godowns = useGodowns();
  const companies = useCompanies();
  const materials = useMaterials();
  const movements = useMovements();
  const [showForm, setShowForm] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  useSyncMovements();

  const site = sites.find((s) => s.id.toString() === siteId);
  if (!site)
    return <div className="p-6 text-muted-foreground">Site not found.</div>;

  const stockItems = computeLocationStock(
    site.id,
    LocationType.site,
    movements,
    materials,
  );
  const totalCost = stockItems.reduce((sum, item) => sum + item.value, 0);

  // Build per-material summary
  const materialSummary = stockItems.map((item) => {
    let totalIn = 0;
    let totalOut = 0;
    for (const m of movements) {
      if (m.materialId !== item.material.id) continue;
      if (
        m.destination &&
        m.destination.id === site.id &&
        m.destination.type === LocationType.site
      ) {
        totalIn += Number(m.quantity);
      }
      if (
        m.source &&
        m.source.id === site.id &&
        m.source.type === LocationType.site
      ) {
        totalOut += Number(m.quantity);
      }
    }
    const cost = Number(item.material.costPerUnit ?? 0n);
    return {
      material: item.material,
      totalIn,
      totalOut,
      available: item.available,
      totalCost: item.available * cost,
    };
  });

  // IN history: movements where destination = this site
  const inHistory = movements
    .filter(
      (m) =>
        m.destination &&
        m.destination.id === site.id &&
        m.destination.type === LocationType.site,
    )
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

  // OUT history: movements where source = this site
  const outHistory = movements
    .filter(
      (m) =>
        m.source &&
        m.source.id === site.id &&
        m.source.type === LocationType.site,
    )
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

  const getMaterialName = (id: bigint) =>
    materials.find((m) => m.id === id)?.name ?? "Unknown";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/sites">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{site.name}</h1>
          {site.location && (
            <p className="text-sm text-muted-foreground">{site.location}</p>
          )}
        </div>
      </div>

      {/* Per-Material Summary */}
      <div className="rounded-xl border overflow-hidden">
        <div className="px-4 py-3 bg-muted/50 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm">Material Summary</h2>
          <span className="text-xs text-muted-foreground font-medium">
            Total: {formatCurrency(totalCost)}
          </span>
        </div>
        {materialSummary.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">
            No stock at this site.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Total IN</TableHead>
                <TableHead className="text-right">Total OUT</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materialSummary.map((item) => (
                <TableRow key={item.material.id.toString()}>
                  <TableCell className="font-medium">
                    {item.material.name}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({item.material.unit})
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-green-700 font-medium">
                    {item.totalIn}
                  </TableCell>
                  <TableCell className="text-right text-amber-600 font-medium">
                    {item.totalOut}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {item.available}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.totalCost)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="font-semibold">
                  Total Location Cost
                </TableCell>
                <TableCell className="text-right font-bold text-green-700">
                  {formatCurrency(totalCost)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </div>

      {/* IN History */}
      <div className="rounded-xl border overflow-hidden">
        <div className="px-4 py-3 bg-green-50 border-b flex items-center gap-2">
          <ArrowDownCircle size={16} className="text-green-700" />
          <h2 className="font-semibold text-sm text-green-700">
            IN History ({inHistory.length})
          </h2>
        </div>
        {inHistory.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground text-sm">
            No IN records.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inHistory.map((m) => (
                <TableRow
                  key={m.id.toString()}
                  className="hover:bg-green-50/50"
                >
                  <TableCell className="font-medium">
                    {getMaterialName(m.materialId)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-green-700">
                    {m.quantity.toString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.source
                      ? getLocationName(m.source, sites, godowns, companies)
                      : "Opening Stock"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatMovementDateTime(m.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* OUT History */}
      <div className="rounded-xl border overflow-hidden">
        <div className="px-4 py-3 bg-amber-50 border-b flex items-center gap-2">
          <ArrowUpCircle size={16} className="text-amber-600" />
          <h2 className="font-semibold text-sm text-amber-600">
            OUT History ({outHistory.length})
          </h2>
        </div>
        {outHistory.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground text-sm">
            No OUT records.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outHistory.map((m) => (
                <TableRow
                  key={m.id.toString()}
                  className="hover:bg-amber-50/50"
                >
                  <TableCell className="font-medium">
                    {getMaterialName(m.materialId)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-amber-600">
                    {m.quantity.toString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.destination
                      ? getLocationName(
                          m.destination,
                          sites,
                          godowns,
                          companies,
                        )
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatMovementDateTime(m.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add Material */}
      <div className="rounded-xl border overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted/70 transition-colors"
          onClick={() => setShowAddMaterial(!showAddMaterial)}
        >
          <span className="font-semibold text-sm">Add Material</span>
          {showAddMaterial ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
        </button>
        {showAddMaterial && (
          <div className="p-4">
            <LocationMaterialForm
              locationId={site.id}
              locationType="site"
              onSuccess={() => setShowAddMaterial(false)}
            />
          </div>
        )}
      </div>

      {/* Add Movement */}
      <div className="rounded-xl border overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted/70 transition-colors"
          onClick={() => setShowForm(!showForm)}
        >
          <span className="font-semibold text-sm">Add Movement</span>
          {showForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showForm && (
          <div className="p-4">
            <MovementForm
              defaultToType="site"
              defaultToLocationId={site.id}
              onSuccess={() => setShowForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
