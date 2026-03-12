import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { BarChart3, Edit2, Package, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import type { Material } from "../backend";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";
import MaterialForm from "../components/MaterialForm";
import { useSyncBackend, useSyncMaterials } from "../hooks/useQueries";
import { formatCurrency } from "../lib/calculations";
import { useMaterials } from "../store/useStore";

export default function Materials() {
  const materials = useMaterials();
  const { isLoading } = useSyncMaterials();
  const { syncDeleteMaterial } = useSyncBackend();

  const [formOpen, setFormOpen] = useState(false);
  const [editMaterial, setEditMaterial] = useState<Material | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Material | undefined>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Materials</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {materials.length} material{materials.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditMaterial(undefined);
            setFormOpen(true);
          }}
        >
          <Plus size={16} className="mr-2" />
          Add Material
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {["s1", "s2", "s3", "s4"].map((k) => (
            <Skeleton key={k} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No materials yet</p>
          <p className="text-sm mt-1">Add your first material to get started</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                  Name
                </th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-foreground">
                  Unit
                </th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-foreground">
                  Cost/Unit
                </th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {materials.map((material) => (
                <tr
                  key={material.id.toString()}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Package size={14} className="text-primary" />
                      </div>
                      <span className="font-medium text-foreground">
                        {material.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="secondary" className="text-xs">
                      {material.unit}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">
                    {formatCurrency(Number(material.costPerUnit))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditMaterial(material);
                          setFormOpen(true);
                        }}
                      >
                        <Edit2 size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(material)}
                      >
                        <Trash2 size={13} />
                      </Button>
                      <Link
                        to="/materials-overview/$materialId"
                        params={{ materialId: material.id.toString() }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-primary"
                        >
                          <BarChart3 size={13} />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MaterialForm
        open={formOpen}
        onOpenChange={setFormOpen}
        material={editMaterial}
      />
      {deleteTarget && (
        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(undefined)}
          itemName={deleteTarget.name}
          onConfirm={() => syncDeleteMaterial(deleteTarget.id)}
        />
      )}
    </div>
  );
}
