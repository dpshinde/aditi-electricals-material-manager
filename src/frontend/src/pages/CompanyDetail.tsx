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
import {
  computeCompanyDetail,
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

export default function CompanyDetail() {
  const { companyId } = useParams({ from: "/companies/$companyId" });
  const companies = useCompanies();
  const sites = useSites();
  const godowns = useGodowns();
  const materials = useMaterials();
  const movements = useMovements();
  const [showAddMaterial, setShowAddMaterial] = useState(false);

  const company = companies.find((c) => c.id.toString() === companyId);
  if (!company) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Company not found.</p>
        <Link to="/companies">
          <Button variant="outline" className="mt-4">
            Back to Companies
          </Button>
        </Link>
      </div>
    );
  }

  const detail = computeCompanyDetail(company, movements, materials);
  const { materialStats, totalValue } = detail;

  const getMaterialName = (id: bigint) =>
    materials.find((m) => m.id === id)?.name ?? "Unknown";

  // IN history: movements where destination = this company
  const inHistory = movements
    .filter(
      (m) =>
        m.destination &&
        m.destination.id === company.id &&
        m.destination.type === LocationType.company,
    )
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

  // OUT history: movements where source = this company
  const outHistory = movements
    .filter(
      (m) =>
        m.source &&
        m.source.id === company.id &&
        m.source.type === LocationType.company,
    )
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/companies">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
          <p className="text-sm text-muted-foreground">
            {materialStats.length} material
            {materialStats.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Material Supply Breakdown */}
      {materialStats.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-xl">
          <p>No movements recorded for this company yet.</p>
          <Link to="/movements">
            <Button className="mt-4">Record Movement</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <div className="px-4 py-3 bg-muted/50 border-b">
            <h2 className="font-semibold text-sm">Material Supply Breakdown</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Returned</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materialStats.map((stat) => (
                <TableRow key={stat.material.id.toString()}>
                  <TableCell className="font-medium">
                    <div>{stat.material.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {stat.material.unit}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-green-700">
                    {stat.sent}
                  </TableCell>
                  <TableCell className="text-right text-amber-600">
                    {stat.returned}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {stat.net}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(stat.value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="font-semibold">
                  Total Value
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(totalValue)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}

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
              locationId={company.id}
              locationType="company"
              onSuccess={() => setShowAddMaterial(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
