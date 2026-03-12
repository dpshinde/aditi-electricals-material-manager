import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import { LocationType } from "../backend";
import type { Movement } from "../backend";
import MovementForm from "../components/MovementForm";
import { useMovementFilters } from "../hooks/useMovementFilters";
import { useDeleteMovement, useSyncMovements } from "../hooks/useQueries";
import {
  filterRealMovements,
  formatMovementDateTime,
  getLocationName,
} from "../lib/calculations";
import { useStore } from "../store/useStore";
import { useMovements } from "../store/useStore";

export default function Movements() {
  const { materials, sites, godowns, companies } = useStore();
  const allMovements = useMovements();
  const movements = filterRealMovements(allMovements);
  const { isLoading } = useSyncMovements();
  const { filters, filtered, updateFilter, resetFilters, hasActiveFilters } =
    useMovementFilters(movements);
  const deleteMovement = useDeleteMovement();

  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [deletingMovement, setDeletingMovement] = useState<Movement | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const getMaterialName = (id: bigint) =>
    materials.find((m) => m.id === id)?.name ?? "Unknown";

  const getMaterialUnit = (id: bigint) =>
    materials.find((m) => m.id === id)?.unit ?? "";

  const getLocLabel = (loc: { type: LocationType; id: bigint } | undefined) => {
    if (!loc) return null;
    const name = getLocationName(loc, sites, godowns, companies);
    return name;
  };

  const sortedMovements = [...filtered].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt),
  );

  const handleDeleteConfirm = async () => {
    if (!deletingMovement) return;
    setDeleteError(null);
    try {
      await deleteMovement.mutateAsync(deletingMovement.id);
      setDeletingMovement(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete movement.";
      setDeleteError(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Movements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} of {movements.length} movement
            {movements.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={hasActiveFilters ? "border-primary text-primary" : ""}
          >
            <Filter size={14} className="mr-1.5" />
            Filters
            {hasActiveFilters && (
              <Badge className="ml-1.5 h-4 w-4 p-0 text-xs flex items-center justify-center">
                !
              </Badge>
            )}
          </Button>
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus size={14} className="mr-1.5" />
            Add
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="rounded-xl border p-4 bg-muted/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Filters</h3>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Material</Label>
              <Select
                value={filters.materialId || "all"}
                onValueChange={(v) =>
                  updateFilter("materialId", v === "all" ? "" : v)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All materials" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All materials</SelectItem>
                  {materials.map((m) => (
                    <SelectItem key={m.id.toString()} value={m.id.toString()}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">From Type</Label>
              <Select
                value={filters.fromLocationType || "all"}
                onValueChange={(v) =>
                  updateFilter("fromLocationType", v === "all" ? "" : v)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value={LocationType.site}>Site</SelectItem>
                  <SelectItem value={LocationType.godown}>Godown</SelectItem>
                  <SelectItem value={LocationType.company}>Company</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">To Type</Label>
              <Select
                value={filters.toLocationType || "all"}
                onValueChange={(v) =>
                  updateFilter("toLocationType", v === "all" ? "" : v)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value={LocationType.site}>Site</SelectItem>
                  <SelectItem value={LocationType.godown}>Godown</SelectItem>
                  <SelectItem value={LocationType.company}>Company</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Person</Label>
              <Input
                className="h-8 text-xs"
                placeholder="Filter by person"
                value={filters.personName}
                onChange={(e) => updateFilter("personName", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Date From</Label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={filters.dateStart}
                onChange={(e) => updateFilter("dateStart", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Date To</Label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={filters.dateEnd}
                onChange={(e) => updateFilter("dateEnd", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Movements Table */}
      {isLoading ? (
        <div className="space-y-2">
          {["t1", "t2", "t3", "t4", "t5"].map((k) => (
            <Skeleton key={k} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : sortedMovements.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl">
          <ArrowRight size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {hasActiveFilters
              ? "No movements match filters"
              : "No movements yet"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Person</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMovements.map((m) => {
                  const fromName = getLocLabel(m.source);
                  const toName = getLocLabel(m.destination);
                  return (
                    <TableRow
                      key={m.id.toString()}
                      className="hover:bg-muted/20"
                    >
                      <TableCell className="font-medium">
                        <div>{getMaterialName(m.materialId)}</div>
                        <div className="text-xs text-muted-foreground">
                          {getMaterialUnit(m.materialId)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {m.quantity.toString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fromName ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {toName ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {m.personName?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatMovementDateTime(m.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setEditingMovement(m)}
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => {
                              setDeletingMovement(m);
                              setDeleteError(null);
                            }}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Add Movement Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Movement</DialogTitle>
          </DialogHeader>
          <MovementForm onSuccess={() => setShowAddForm(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Movement Dialog */}
      <Dialog
        open={!!editingMovement}
        onOpenChange={(o) => !o && setEditingMovement(null)}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Movement</DialogTitle>
          </DialogHeader>
          {editingMovement && (
            <MovementForm
              initialMovement={editingMovement}
              onSuccess={() => setEditingMovement(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingMovement}
        onOpenChange={(o) => {
          if (!o && !deleteMovement.isPending) {
            setDeletingMovement(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Movement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this movement and update stock
              calculations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive px-1">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMovement.isPending}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMovement.isPending}
            >
              {deleteMovement.isPending ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
