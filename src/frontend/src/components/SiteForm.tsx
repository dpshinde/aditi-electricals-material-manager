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
import type { Site } from "../backend";
import { useSyncBackend } from "../hooks/useQueries";

interface SiteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site?: Site;
}

export default function SiteForm({ open, onOpenChange, site }: SiteFormProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { syncCreateSite, syncUpdateSite } = useSyncBackend();

  useEffect(() => {
    if (open) {
      setName(site?.name ?? "");
      setLocation(site?.location ?? "");
      setError("");
    }
  }, [open, site]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (site) {
        await syncUpdateSite(
          site.id,
          name.trim(),
          location.trim() || undefined,
        );
      } else {
        await syncCreateSite(name.trim(), location.trim() || undefined);
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
          <DialogTitle>{site ? "Edit Site" : "Add Site"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="site-name">Name *</Label>
            <Input
              id="site-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Site name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="site-location">Location</Label>
            <Input
              id="site-location"
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
              {loading ? "Saving..." : site ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
