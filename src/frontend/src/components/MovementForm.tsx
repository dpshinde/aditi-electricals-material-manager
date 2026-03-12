import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Movement } from "../backend";
import { LocationType, MovementType } from "../backend";
import { useActor } from "../hooks/useActor";
import { useCreateMovement, useUpdateMovement } from "../hooks/useQueries";
import {
  useCompanies,
  useGodowns,
  useMaterials,
  useSites,
  useStore,
} from "../store/useStore";

interface MovementFormProps {
  onSuccess?: () => void;
  initialMovement?: Movement;
  defaultToType?: "site" | "godown" | "company";
  defaultToLocationId?: bigint;
}

function toLocationType(t: string): LocationType {
  if (t === "site") return LocationType.site;
  if (t === "godown") return LocationType.godown;
  return LocationType.company;
}

export default function MovementForm({
  onSuccess,
  initialMovement,
  defaultToType,
  defaultToLocationId,
}: MovementFormProps) {
  const materials = useMaterials();
  const sites = useSites();
  const godowns = useGodowns();
  const companies = useCompanies();
  const addMaterial = useStore((s) => s.addMaterial);
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  // Retry actor connection if it failed to initialize
  const retryActorConnection = () => {
    queryClient.invalidateQueries({
      predicate: (q) => q.queryKey.includes("actor"),
    });
    queryClient.refetchQueries({
      predicate: (q) => q.queryKey.includes("actor"),
    });
  };

  const createMovement = useCreateMovement();
  const updateMovement = useUpdateMovement();

  // materialId is the resolved bigint ID (as string), materialInput is the raw typed/selected text
  const [materialId, setMaterialId] = useState<string>("");
  const [materialInput, setMaterialInput] = useState<string>("");
  const [materialOpen, setMaterialOpen] = useState(false);

  const [quantity, setQuantity] = useState("");
  const [fromType, setFromType] = useState<string | undefined>(undefined);
  const [fromId, setFromId] = useState<string | undefined>(undefined);
  const [toType, setToType] = useState<string | undefined>(defaultToType);
  const [toId, setToId] = useState<string | undefined>(
    defaultToLocationId?.toString(),
  );
  const [personName, setPersonName] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  // 12-hour time state
  const [dateStr, setDateStr] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [hour12, setHour12] = useState(() => {
    const h = new Date().getHours() % 12 || 12;
    return h.toString().padStart(2, "0");
  });
  const [minute, setMinute] = useState(() =>
    new Date().getMinutes().toString().padStart(2, "0"),
  );
  const [ampm, setAmpm] = useState<"AM" | "PM">(() =>
    new Date().getHours() < 12 ? "AM" : "PM",
  );

  // Build ISO timestamp string from 12-hour parts
  const getTimestamp = () => {
    const h12 = Number.parseInt(hour12) || 12;
    let h24 =
      ampm === "AM" ? (h12 === 12 ? 0 : h12) : h12 === 12 ? 12 : h12 + 12;
    return `${dateStr}T${h24.toString().padStart(2, "0")}:${minute.padStart(2, "0")}`;
  };

  const [error, setError] = useState("");

  useEffect(() => {
    if (initialMovement) {
      const mid = initialMovement.materialId.toString();
      setMaterialId(mid);
      // Set display name from existing materials
      const mat = materials.find((m) => m.id.toString() === mid);
      setMaterialInput(mat ? mat.name : mid);
      setQuantity(initialMovement.quantity.toString());
      setFromType(initialMovement.source?.type);
      setFromId(initialMovement.source?.id.toString());
      setToType(initialMovement.destination?.type);
      setToId(initialMovement.destination?.id.toString());
      setPersonName(initialMovement.personName?.name ?? "");
      setCostPerUnit(
        initialMovement.costPerUnit
          ? Number(initialMovement.costPerUnit).toString()
          : "",
      );
      const ts = Number(initialMovement.timestamp) / 1_000_000;
      if (ts > 1_000_000_000_000) {
        const d = new Date(ts);
        setDateStr(d.toISOString().slice(0, 10));
        const h = d.getHours();
        setHour12((h % 12 || 12).toString().padStart(2, "0"));
        setMinute(d.getMinutes().toString().padStart(2, "0"));
        setAmpm(h < 12 ? "AM" : "PM");
      }
    }
  }, [initialMovement, materials]);

  const getLocations = (type: string | undefined) => {
    if (type === "site") return sites;
    if (type === "godown") return godowns;
    if (type === "company") return companies;
    return [];
  };

  // Returns filtered materials list based on search input
  const filteredMaterials = materialInput.trim()
    ? materials.filter((m) =>
        m.name.toLowerCase().includes(materialInput.toLowerCase()),
      )
    : materials;

  // Check if typed name exactly matches an existing material (case-insensitive)
  const exactMatch = materials.find(
    (m) => m.name.toLowerCase() === materialInput.trim().toLowerCase(),
  );

  const isLoading = createMovement.isPending || updateMovement.isPending;

  // Resolve or auto-create material, returns the material ID as bigint
  const resolveOrCreateMaterial = async (): Promise<bigint | null> => {
    if (materialId) return BigInt(materialId);

    const trimmed = materialInput.trim();
    if (!trimmed) return null;

    // Check case-insensitive match
    const match = materials.find(
      (m) => m.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (match) return match.id;

    // Auto-create new material
    if (!actor) throw new Error("Actor not available");
    const newId = await actor.createMaterial({
      name: trimmed,
      unit: "pcs",
      costPerUnit: undefined,
    });
    const newMaterial = {
      id: newId,
      name: trimmed,
      unit: "pcs",
      costPerUnit: undefined,
    };
    addMaterial(newMaterial);
    queryClient.invalidateQueries({ queryKey: ["materials"] });
    return newId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialInput.trim() && !materialId) {
      setError("Material is required");
      return;
    }
    const qty = Number.parseInt(quantity);
    if (!qty || qty <= 0) {
      setError("Valid quantity is required");
      return;
    }
    setError("");

    if (!actor) {
      setError(
        "Backend is not connected yet. Please wait a moment and try again.",
      );
      return;
    }

    const tsMs = new Date(getTimestamp()).getTime();
    const tsNs = BigInt(Math.round(tsMs * 1_000_000));

    const source =
      fromType && fromId
        ? { type: toLocationType(fromType), id: BigInt(fromId) }
        : undefined;
    const destination =
      toType && toId
        ? { type: toLocationType(toType), id: BigInt(toId) }
        : undefined;
    const cost = costPerUnit
      ? BigInt(Math.round(Number.parseFloat(costPerUnit)))
      : undefined;
    const person = personName.trim()
      ? {
          direction: { __kind__: "responsible" as const, responsible: null },
          name: personName.trim(),
        }
      : undefined;

    try {
      const resolvedMaterialId = await resolveOrCreateMaterial();
      if (!resolvedMaterialId) {
        setError("Material is required");
        return;
      }

      if (initialMovement) {
        await updateMovement.mutateAsync({
          id: initialMovement.id,
          quantity: BigInt(qty),
          source: source ?? null,
          destination: destination ?? null,
          personName: person ?? null,
          costPerUnit: cost ?? null,
          timestamp: tsNs,
        });
        toast.success("Movement updated");
      } else {
        await createMovement.mutateAsync({
          materialId: resolvedMaterialId,
          movementType: MovementType.fromTo,
          quantity: BigInt(qty),
          source,
          destination,
          personName: person,
          companyId: undefined,
          costPerUnit: cost,
          timestamp: tsNs,
        });
        toast.success("Movement added");
        setMaterialId("");
        setMaterialInput("");
        setQuantity("");
        setFromType(undefined);
        setFromId(undefined);
        if (!defaultToType) setToType(undefined);
        if (!defaultToLocationId) setToId(undefined);
        setPersonName("");
        setCostPerUnit("");
        const now = new Date();
        setDateStr(now.toISOString().slice(0, 10));
        setHour12((now.getHours() % 12 || 12).toString().padStart(2, "0"));
        setMinute(now.getMinutes().toString().padStart(2, "0"));
        setAmpm(now.getHours() < 12 ? "AM" : "PM");
      }
      onSuccess?.();
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "Failed to save movement");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Material – searchable + creatable combobox */}
      <div className="space-y-2">
        <Label>Material *</Label>
        <Popover open={materialOpen} onOpenChange={setMaterialOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              // biome-ignore lint/a11y/useSemanticElements: custom combobox using Radix Popover
              role="combobox"
              aria-expanded={materialOpen}
              className="w-full justify-between font-normal"
            >
              <span className={cn(!materialInput && "text-muted-foreground")}>
                {materialInput || "Search or type a material name"}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search or type material..."
                value={materialInput}
                onValueChange={(val) => {
                  setMaterialInput(val);
                  // Clear selected ID when user types a new value
                  setMaterialId("");
                }}
              />
              <CommandList>
                {/* "Create" option when input doesn't match any existing material */}
                {materialInput.trim() && !exactMatch && (
                  <CommandGroup heading="Create new">
                    <CommandItem
                      value={`__create__${materialInput}`}
                      onSelect={() => {
                        // Will be auto-created on submit — just set the name
                        setMaterialId("");
                        setMaterialOpen(false);
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4 text-primary" />
                      Create &ldquo;{materialInput.trim()}&rdquo;
                    </CommandItem>
                  </CommandGroup>
                )}
                {filteredMaterials.length > 0 && (
                  <CommandGroup heading="Existing materials">
                    {filteredMaterials.map((m) => (
                      <CommandItem
                        key={m.id.toString()}
                        value={m.id.toString()}
                        onSelect={() => {
                          setMaterialId(m.id.toString());
                          setMaterialInput(m.name);
                          setMaterialOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            materialId === m.id.toString()
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {m.name} ({m.unit})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {filteredMaterials.length === 0 && !materialInput.trim() && (
                  <CommandEmpty>No materials found.</CommandEmpty>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>Quantity *</Label>
        <Input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>From Type</Label>
          <Select
            value={fromType ?? "__none__"}
            onValueChange={(v) => {
              setFromType(v === "__none__" ? undefined : v);
              setFromId(undefined);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              <SelectItem value="site">Site</SelectItem>
              <SelectItem value="godown">Godown</SelectItem>
              <SelectItem value="company">Company</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>From Location</Label>
          <Select
            value={fromId ?? "__none__"}
            onValueChange={(v) => setFromId(v === "__none__" ? undefined : v)}
            disabled={!fromType}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {getLocations(fromType).map((loc) => (
                <SelectItem key={loc.id.toString()} value={loc.id.toString()}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>To Type</Label>
          <Select
            value={toType ?? "__none__"}
            onValueChange={(v) => {
              setToType(v === "__none__" ? undefined : v);
              setToId(undefined);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              <SelectItem value="site">Site</SelectItem>
              <SelectItem value="godown">Godown</SelectItem>
              <SelectItem value="company">Company</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>To Location</Label>
          <Select
            value={toId ?? "__none__"}
            onValueChange={(v) => setToId(v === "__none__" ? undefined : v)}
            disabled={!toType}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {getLocations(toType).map((loc) => (
                <SelectItem key={loc.id.toString()} value={loc.id.toString()}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Date &amp; Time</Label>
        <div className="flex gap-2">
          <Input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="flex-1"
          />
          <Select value={hour12} onValueChange={setHour12}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) =>
                (i + 1).toString().padStart(2, "0"),
              ).map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={minute} onValueChange={setMinute}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 60 }, (_, i) =>
                i.toString().padStart(2, "0"),
              ).map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ampm} onValueChange={(v) => setAmpm(v as "AM" | "PM")}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Person Name</Label>
        <Input
          value={personName}
          onChange={(e) => setPersonName(e.target.value)}
          placeholder="Responsible person"
        />
      </div>

      <div className="space-y-2">
        <Label>Cost per Unit (₹)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={costPerUnit}
          onChange={(e) => setCostPerUnit(e.target.value)}
          placeholder="0"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!actor && !actorFetching ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            Backend not connected. Please retry.
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={retryActorConnection}
          >
            Retry Connection
          </Button>
        </div>
      ) : (
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || actorFetching || !actor}
        >
          {actorFetching
            ? "Connecting..."
            : isLoading
              ? "Saving..."
              : initialMovement
                ? "Update Movement"
                : "Add Movement"}
        </Button>
      )}
    </form>
  );
}
