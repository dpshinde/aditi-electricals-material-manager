import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type React from "react";
import { useEffect, useState } from "react";
import type { Material } from "../backend";
import { useSyncBackend } from "../hooks/useQueries";

interface MaterialFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: Material;
}

export default function MaterialForm({
  open,
  onOpenChange,
  material,
}: MaterialFormProps) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { syncCreateMaterial, syncUpdateMaterial } = useSyncBackend();

  useEffect(() => {
    if (open) {
      setName(material?.name ?? "");
      setUnit(material?.unit ?? "");
      setCostPerUnit(
        material?.costPerUnit !== undefined
          ? Number(material.costPerUnit).toString()
          : "",
      );
      setError("");
    }
  }, [open, material]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!unit.trim()) {
      setError("Unit is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const cost =
        costPerUnit.trim() === ""
          ? undefined
          : BigInt(Math.round(Number.parseFloat(costPerUnit)));
      const input = { name: name.trim(), unit: unit.trim(), costPerUnit: cost };
      if (material) {
        await syncUpdateMaterial(material.id, input);
      } else {
        await syncCreateMaterial(input);
      }
      onOpenChange(false);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {material ? "Edit Material" : "Add Material"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="mat-name">Name *</Label>
            <Input
              id="mat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Material name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mat-unit">Unit *</Label>
            <Input
              id="mat-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. kg, pcs, m"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mat-cost">Cost per Unit (₹)</Label>
            <Input
              id="mat-cost"
              type="number"
              min="0"
              step="0.01"
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(e.target.value)}
              placeholder="0"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : material ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
