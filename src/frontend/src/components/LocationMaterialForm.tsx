import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type React from "react";
import { useId, useState } from "react";
import { LocationType, MovementType } from "../backend";
import { useCreateMovement, useSyncBackend } from "../hooks/useQueries";
import { useMaterials } from "../store/useStore";

interface LocationMaterialFormProps {
  locationId: bigint;
  locationType: "site" | "godown" | "company";
  onSuccess?: () => void;
}

const locTypeMap: Record<string, LocationType> = {
  site: LocationType.site,
  godown: LocationType.godown,
  company: LocationType.company,
};

export default function LocationMaterialForm({
  locationId,
  locationType,
  onSuccess,
}: LocationMaterialFormProps) {
  const uid = useId();
  const materials = useMaterials();
  const { syncCreateMaterial } = useSyncBackend();
  const createMovementMutation = useCreateMovement();

  const [materialName, setMaterialName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = materialName.trim();
    if (!trimmedName) {
      setError("Material name is required");
      return;
    }
    const qty = Number.parseInt(quantity, 10);
    if (!quantity.trim() || Number.isNaN(qty) || qty < 1) {
      setError("Quantity must be at least 1");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const costValue =
        costPerUnit.trim() === ""
          ? undefined
          : BigInt(Math.round(Number.parseFloat(costPerUnit)));

      // Find existing material by name or create new one
      const existing = materials.find(
        (m) => m.name.toLowerCase() === trimmedName.toLowerCase(),
      );
      let materialId: bigint;
      if (existing) {
        materialId = existing.id;
      } else {
        materialId = await syncCreateMaterial({
          name: trimmedName,
          unit: "pcs",
          costPerUnit: costValue,
        });
      }

      // Create opening stock entry (not a real transfer movement)
      await createMovementMutation.mutateAsync({
        materialId,
        movementType: MovementType.outStockCheck,
        quantity: BigInt(qty),
        source: undefined,
        destination: { id: locationId, type: locTypeMap[locationType] },
        personName: undefined,
        companyId: undefined,
        costPerUnit: costValue,
        timestamp: BigInt(Date.now()) * 1_000_000n,
      });

      // Reset form
      setMaterialName("");
      setQuantity("");
      setCostPerUnit("");
      onSuccess?.();
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to add material");
    } finally {
      setLoading(false);
    }
  };

  const listId = `${uid}-materials`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <datalist id={listId}>
        {materials.map((m) => (
          <option key={m.id.toString()} value={m.name} />
        ))}
      </datalist>

      <div className="space-y-2">
        <Label htmlFor={`${uid}-name`}>Material Name *</Label>
        <Input
          id={`${uid}-name`}
          list={listId}
          value={materialName}
          onChange={(e) => setMaterialName(e.target.value)}
          placeholder="Enter or select material name"
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${uid}-qty`}>Quantity *</Label>
        <Input
          id={`${uid}-qty`}
          type="number"
          min="1"
          step="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Enter quantity"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${uid}-cost`}>Cost per Unit (₹)</Label>
        <Input
          id={`${uid}-cost`}
          type="number"
          min="0"
          step="0.01"
          value={costPerUnit}
          onChange={(e) => setCostPerUnit(e.target.value)}
          placeholder="0 (optional)"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Adding..." : "Add Material"}
        </Button>
      </div>
    </form>
  );
}
