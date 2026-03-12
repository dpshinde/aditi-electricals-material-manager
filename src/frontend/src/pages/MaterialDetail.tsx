import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Building2, MapPin, Warehouse } from "lucide-react";
import React, { useMemo } from "react";
import { LocationType } from "../backend";
import { computeMaterialOverview, formatCurrency } from "../lib/calculations";
import {
  useCompanies,
  useGodowns,
  useMaterials,
  useMovements,
  useSites,
} from "../store/useStore";

export default function MaterialDetail() {
  const { materialId } = useParams({ from: "/materials-overview/$materialId" });
  const materials = useMaterials();
  const sites = useSites();
  const godowns = useGodowns();
  const companies = useCompanies();
  const movements = useMovements();

  const material = useMemo(
    () => materials.find((m) => m.id.toString() === materialId),
    [materials, materialId],
  );

  const overview = useMemo(
    () =>
      material
        ? computeMaterialOverview(
            material,
            movements,
            sites,
            godowns,
            companies,
          )
        : null,
    [material, movements, sites, godowns, companies],
  );

  if (!material || !overview) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Material not found.</p>
        <Link to="/materials-overview">
          <Button variant="outline" className="mt-4">
            Back to Overview
          </Button>
        </Link>
      </div>
    );
  }

  const { totalIn, totalOut, available, totalValue, locationBreakdown } =
    overview;

  const getLocationIcon = (type: LocationType) => {
    if (type === LocationType.site)
      return <MapPin size={14} className="text-primary" />;
    if (type === LocationType.godown)
      return <Warehouse size={14} className="text-primary" />;
    return <Building2 size={14} className="text-primary" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/materials-overview">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">
              {material.name}
            </h1>
            <Badge variant="secondary">{material.unit}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Cost: {formatCurrency(Number(material.costPerUnit))}/{material.unit}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-xs text-muted-foreground font-medium">Total IN</p>
          <p className="text-2xl font-bold text-green-700">+{totalIn}</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
          <p className="text-xs text-muted-foreground font-medium">Total OUT</p>
          <p className="text-2xl font-bold text-orange-600">-{totalOut}</p>
        </div>
        <div
          className={cn(
            "rounded-xl p-4 border",
            available > 5
              ? "bg-green-50 border-green-100"
              : available > 0
                ? "bg-amber-50 border-amber-100"
                : "bg-amber-50 border-amber-100",
          )}
        >
          <p className="text-xs text-muted-foreground font-medium">Available</p>
          <p
            className={cn(
              "text-2xl font-bold",
              available > 5
                ? "text-green-700"
                : available > 0
                  ? "text-amber-600"
                  : "text-amber-600",
            )}
          >
            {available}
          </p>
        </div>
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
          <p className="text-xs text-muted-foreground font-medium">
            Stock Value
          </p>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(totalValue)}
          </p>
        </div>
      </div>

      {locationBreakdown.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-xl">
          <p>No movements recorded for this material yet.</p>
          <Link to="/movements">
            <Button className="mt-4">Record Movement</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <div className="px-4 py-3 bg-muted/50 border-b">
            <h2 className="font-semibold text-sm">Location Breakdown</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Location</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locationBreakdown.map((row) => (
                <TableRow
                  key={`${row.locationType}-${row.locationId.toString()}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getLocationIcon(row.locationType)}
                      <span className="font-medium">{row.locationName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs capitalize">
                      {row.locationType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "font-semibold",
                        row.available > 5
                          ? "text-green-700"
                          : row.available > 0
                            ? "text-amber-600"
                            : "text-amber-600",
                      )}
                    >
                      {row.available}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-foreground">
                    {formatCurrency(row.value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-semibold">
                  Total ({locationBreakdown.length} location
                  {locationBreakdown.length !== 1 ? "s" : ""})
                </TableCell>
                <TableCell className="text-right font-bold">
                  {available}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(totalValue)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
