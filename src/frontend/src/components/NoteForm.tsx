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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Image, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Note } from "../backend";
import { ExternalBlob, LocationType } from "../backend";
import { useCreateNote, useUpdateNote } from "../hooks/useQueries";
import { useCompanies, useGodowns, useSites } from "../store/useStore";

interface NoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: Note;
}

export default function NoteForm({ open, onOpenChange, note }: NoteFormProps) {
  const sites = useSites();
  const godowns = useGodowns();
  const companies = useCompanies();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationType, setLocationType] = useState<string | undefined>(
    undefined,
  );
  const [locationId, setLocationId] = useState<string | undefined>(undefined);
  const [personName, setPersonName] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle(note?.title ?? "");
      setDescription(note?.description ?? "");
      setPersonName(note?.relatedPersonName ?? "");
      setLocationType(note?.relatedLocation?.type);
      setLocationId(note?.relatedLocation?.id.toString());
      setPhotos(note?.photos.map((p) => p.getDirectURL()) ?? []);
      setError("");
    }
  }, [open, note]);

  const getLocations = (type: string | undefined) => {
    if (type === "site") return sites;
    if (type === "godown") return godowns;
    if (type === "company") return companies;
    return [];
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setPhotos((prev) => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const isLoading = createNote.isPending || updateNote.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setError("");

    let relatedLocation: { type: LocationType; id: bigint } | undefined;
    if (locationType && locationId) {
      const typeMap: Record<string, LocationType> = {
        site: LocationType.site,
        godown: LocationType.godown,
        company: LocationType.company,
      };
      relatedLocation = { type: typeMap[locationType], id: BigInt(locationId) };
    }

    const photoBlobs = await Promise.all(
      photos.map(async (p) => {
        if (p.startsWith("http")) return ExternalBlob.fromURL(p);
        const res = await fetch(p);
        const buf = await res.arrayBuffer();
        return ExternalBlob.fromBytes(new Uint8Array(buf));
      }),
    );

    const input = {
      title: title.trim(),
      description: description.trim(),
      relatedLocation,
      relatedPersonName: personName.trim() || undefined,
      photos: photoBlobs,
    };

    try {
      if (note) {
        await updateNote.mutateAsync({ id: note.id, input });
        toast.success("Note updated");
      } else {
        await createNote.mutateAsync(input);
        toast.success("Note created");
      }
      onOpenChange(false);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "Failed to save note");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{note ? "Edit Note" : "Add Note"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="note-title">Title *</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-desc">Description</Label>
            <Textarea
              id="note-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Note details..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Location Type</Label>
              <Select
                value={locationType ?? "__none__"}
                onValueChange={(v) => {
                  setLocationType(v === "__none__" ? undefined : v);
                  setLocationId(undefined);
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
              <Label>Location</Label>
              <Select
                value={locationId ?? "__none__"}
                onValueChange={(v) =>
                  setLocationId(v === "__none__" ? undefined : v)
                }
                disabled={!locationType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {getLocations(locationType).map((loc) => (
                    <SelectItem
                      key={loc.id.toString()}
                      value={loc.id.toString()}
                    >
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-person">Related Person</Label>
            <Input
              id="note-person"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Person name"
            />
          </div>
          <div className="space-y-2">
            <Label>Photos</Label>
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: photo list has no stable id
                  key={i}
                  className="relative w-20 h-20 rounded-lg overflow-hidden border"
                >
                  <img
                    src={p}
                    alt={`Note attachment ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {/* Camera button */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors text-muted-foreground hover:text-primary"
                data-ocid="note.camera_button"
              >
                <Camera size={16} />
                <span className="text-xs">Camera</span>
              </button>
              {/* Gallery button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors text-muted-foreground hover:text-primary"
                data-ocid="note.upload_button"
              >
                <Image size={16} />
                <span className="text-xs">Gallery</span>
              </button>
            </div>
            {/* Gallery file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
            {/* Camera capture input */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : note ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
