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
import type { Godown } from "../backend";
import { useSyncBackend } from "../hooks/useQueries";

interface GodownFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  godown?: Godown;
}

export default function GodownForm({
  open,
  onOpenChange,
  godown,
}: GodownFormProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { syncCreateGodown, syncUpdateGodown } = useSyncBackend();

  useEffect(() => {
    if (open) {
      setName(godown?.name ?? "");
      setLocation(godown?.location ?? "");
      setError("");
    }
  }, [open, godown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (godown) {
        await syncUpdateGodown(
          godown.id,
          name.trim(),
          location.trim() || undefined,
        );
      } else {
        await syncCreateGodown(name.trim(), location.trim() || undefined);
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
          <DialogTitle>{godown ? "Edit Godown" : "Add Godown"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="godown-name">Name *</Label>
            <Input
              id="godown-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Godown name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="godown-location">Location</Label>
            <Input
              id="godown-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Optional location"
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
              {loading ? "Saving..." : godown ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
