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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Image as ImageIcon,
  MapPin,
  Pencil,
  Plus,
  StickyNote,
  Trash2,
  User,
} from "lucide-react";
import React, { useState } from "react";
import type { Note } from "../backend";
import { LocationType } from "../backend";
import ImageLightbox from "../components/ImageLightbox";
import NoteForm from "../components/NoteForm";
import { useDeleteNote, useSyncNotes } from "../hooks/useQueries";
import {
  useCompanies,
  useGodowns,
  useNotes,
  useSites,
} from "../store/useStore";

export default function Notes() {
  const notes = useNotes();
  const sites = useSites();
  const godowns = useGodowns();
  const companies = useCompanies();
  const { isLoading } = useSyncNotes();
  const deleteNote = useDeleteNote();

  const [formOpen, setFormOpen] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const getLocationLabel = (note: Note): string => {
    if (!note.relatedLocation) return "";
    const { type, id } = note.relatedLocation;
    if (type === LocationType.site) {
      return `Site: ${sites.find((s) => s.id === id)?.name ?? `#${id}`}`;
    }
    if (type === LocationType.godown) {
      return `Godown: ${godowns.find((g) => g.id === id)?.name ?? `#${id}`}`;
    }
    if (type === LocationType.company) {
      return `Company: ${companies.find((c) => c.id === id)?.name ?? `#${id}`}`;
    }
    return "";
  };

  const formatDate = (ts: bigint): string => {
    if (!ts || ts === 0n) return "";
    const ms = Number(ts) / 1_000_000;
    if (ms < 1_000_000_000_000) return "";
    return new Date(ms).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteError("");
    try {
      await deleteNote.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e: unknown) {
      setDeleteError((e as Error)?.message ?? "Failed to delete");
    }
  };

  const sortedNotes = [...notes].sort(
    (a, b) => Number(b.date) - Number(a.date),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {notes.length} note{notes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditNote(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} className="mr-2" />
          Add Note
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {["s1", "s2", "s3"].map((k) => (
            <Skeleton key={k} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : sortedNotes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl">
          <StickyNote size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No notes yet</p>
          <p className="text-sm mt-1">Add your first note to get started</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedNotes.map((note) => {
            const locationLabel = getLocationLabel(note);
            const dateStr = formatDate(note.date);
            return (
              <div
                key={note.id.toString()}
                className="bg-card border rounded-xl p-4 hover:shadow-md transition-shadow flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground leading-tight">
                    {note.title}
                  </h3>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditNote(note);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => {
                        setDeleteTarget(note);
                        setDeleteError("");
                      }}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>

                {note.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {note.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {dateStr && (
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {dateStr}
                    </span>
                  )}
                  {locationLabel && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} />
                      {locationLabel}
                    </span>
                  )}
                  {note.relatedPersonName && (
                    <span className="flex items-center gap-1">
                      <User size={11} />
                      {note.relatedPersonName}
                    </span>
                  )}
                </div>

                {note.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {note.photos.map((photo, idx) => (
                      <button
                        // biome-ignore lint/suspicious/noArrayIndexKey: photos have no stable id
                        key={idx}
                        type="button"
                        onClick={() => setLightboxSrc(photo.getDirectURL())}
                        className="w-16 h-16 rounded-lg overflow-hidden border hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={photo.getDirectURL()}
                          alt={`Note attachment ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <NoteForm
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditNote(null);
        }}
        note={editNote ?? undefined}
      />

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) {
            setDeleteTarget(null);
            setDeleteError("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTarget?.title}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive px-1">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteNote.isPending}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteNote.isPending}
            >
              {deleteNote.isPending ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
