import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { Building2, ChevronRight, Edit2, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import type { Company } from "../backend";
import CompanyForm from "../components/CompanyForm";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";
import { useSyncBackend, useSyncCompanies } from "../hooks/useQueries";
import { computeCompanyDetail, formatCurrency } from "../lib/calculations";
import { useCompanies, useMaterials, useMovements } from "../store/useStore";

export default function Companies() {
  const companies = useCompanies();
  const movements = useMovements();
  const materials = useMaterials();
  const { isLoading } = useSyncCompanies();
  const { syncDeleteCompany } = useSyncBackend();

  const [formOpen, setFormOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Company | undefined>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Companies</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {companies.length} compan{companies.length !== 1 ? "ies" : "y"}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditCompany(undefined);
            setFormOpen(true);
          }}
        >
          <Plus size={16} className="mr-2" />
          Add Company
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {["s1", "s2", "s3"].map((k) => (
            <Skeleton key={k} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl">
          <Building2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No companies yet</p>
          <p className="text-sm mt-1">Add your first company to get started</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => {
            const detail = computeCompanyDetail(company, movements, materials);
            return (
              <div
                key={company.id.toString()}
                className="bg-card border rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {company.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {detail.materialStats.length} material
                      {detail.materialStats.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditCompany(company);
                        setFormOpen(true);
                      }}
                    >
                      <Edit2 size={13} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(company)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">
                    {formatCurrency(detail.totalValue)}
                  </span>
                  <Link
                    to="/companies/$companyId"
                    params={{ companyId: company.id.toString() }}
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

      <CompanyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        company={editCompany}
      />
      {deleteTarget && (
        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(undefined)}
          itemName={deleteTarget.name}
          onConfirm={() => syncDeleteCompany(deleteTarget.id)}
        />
      )}
    </div>
  );
}
