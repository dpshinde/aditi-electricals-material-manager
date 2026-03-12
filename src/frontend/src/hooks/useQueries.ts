import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type {
  BasicLocation,
  Company,
  Godown,
  Material,
  MaterialInput,
  Movement,
  MovementInput,
  Note,
  NoteInput,
  PersonInfo,
  Site,
} from "../backend";
import { useStore } from "../store/useStore";
import { useActor } from "./useActor";

// ── Sync hooks ─────────────────────────────────────────────────────────────

export function useSyncSites() {
  const { actor, isFetching } = useActor();
  const setSites = useStore((s) => s.setSites);
  return useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      if (!actor) return [];
      const data = await actor.getSites();
      setSites(data);
      return data;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSyncGodowns() {
  const { actor, isFetching } = useActor();
  const setGodowns = useStore((s) => s.setGodowns);
  return useQuery({
    queryKey: ["godowns"],
    queryFn: async () => {
      if (!actor) return [];
      const data = await actor.getGodowns();
      setGodowns(data);
      return data;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSyncCompanies() {
  const { actor, isFetching } = useActor();
  const setCompanies = useStore((s) => s.setCompanies);
  return useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      if (!actor) return [];
      const data = await actor.getCompanies();
      setCompanies(data);
      return data;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSyncMaterials() {
  const { actor, isFetching } = useActor();
  const setMaterials = useStore((s) => s.setMaterials);
  return useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      if (!actor) return [];
      const data = await actor.getMaterials();
      setMaterials(data);
      return data;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSyncMovements() {
  const { actor, isFetching } = useActor();
  const setMovements = useStore((s) => s.setMovements);
  return useQuery({
    queryKey: ["movements"],
    queryFn: async () => {
      if (!actor) return [];
      const data = await actor.getMovements();
      setMovements(data);
      return data;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSyncNotes() {
  const { actor, isFetching } = useActor();
  const setNotes = useStore((s) => s.setNotes);
  return useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      if (!actor) return [];
      const data = await actor.getNotes();
      setNotes(data);
      return data;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSyncMaterialsWithStockInfo() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["materialsWithStockInfo"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMaterialsWithStockInfo();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── useSyncBackend helper ──────────────────────────────────────────────────

export function useSyncBackend() {
  const { actor } = useActor();
  // Use a ref so mutation functions always read the latest actor value,
  // even if they were created before the actor finished initializing.
  const actorRef = useRef(actor);
  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);
  const queryClient = useQueryClient();
  const store = useStore();

  const syncCreateSite = async (
    name: string,
    location?: string,
  ): Promise<bigint> => {
    const currentActor = actorRef.current;
    if (!currentActor) throw new Error("Actor not available");
    const id = await currentActor.createSite(name, location ?? null);
    const site: Site = { id, name, location };
    store.addSite(site);
    queryClient.invalidateQueries({ queryKey: ["sites"] });
    return id;
  };

  const syncUpdateSite = async (
    id: bigint,
    name: string,
    location?: string,
  ): Promise<void> => {
    const currentActor = actorRef.current;
    if (!currentActor) throw new Error("Actor not available");
    await currentActor.updateSite(id, name, location ?? null);
    const site: Site = { id, name, location };
    store.updateSite(site);
    queryClient.invalidateQueries({ queryKey: ["sites"] });
  };

  const syncDeleteSite = async (id: bigint): Promise<void> => {
    const currentActor = actorRef.current;
    if (!currentActor) throw new Error("Actor not available");
    await currentActor.deleteSite(id);
    store.deleteSite(id);
    queryClient.invalidateQueries({ queryKey: ["sites"] });
  };

  const syncCreateGodown = async (
    name: string,
    location?: string,
  ): Promise<bigint> => {
    const currentActor = actorRef.current;
    if (!currentActor) throw new Error("Actor not available");
    const id = await currentActor.createGodown(name, location ?? null);
    const godown: Godown = { id, name, location };
    store.addGodown(godown);
    queryClient.invalidateQueries({ queryKey: ["godowns"] });
    return id;
  };

  const syncUpdateGodown = async (
    id: bigint,
    name: string,
    location?: string,
  ): Promise<void> => {
    const currentActor = actorRef.current;
    if (!currentActor) throw new Error("Actor not available");
    await currentActor.updateGodown(id, name, location ?? null);
    const godown: Godown = { id, name, location };
    store.updateGodown(godown);
    queryClient.invalidateQueries({ queryKey: ["godowns"] });
  };

  const syncDeleteGodown = async (id: bigint): Promise<void> => {
    const currentActor = actorRef.current;
    if (!currentActor) throw new Error("Actor not available");
    await currentActor.deleteGodown(id);
    store.deleteGodown(id);
    queryClient.invalidateQueries({ queryKey: ["godowns"] });
  };

  const syncCreateCompany = async (name: string): Promise<bigint> => {
    const currentActor = actorRef.current;
    if (!currentActor) throw new Error("Actor not available");
    const id = await currentActor.createCompany(name);
    const company: Company = { id, name };
    store.addCompany(company);
    queryClient.invalidateQueries({ queryKey: ["companies"] });
    return id;
  };

  const syncUpdateCompany = async (id: bigint, name: string): Promise<void> => {
    const currentActor = actorRef.current;
    if (!currentActor) throw new Error("Actor not available");
    await currentActor.updateCompany(id, name);
    const company: Company = { id, name };
    store.updateCompany(company);
    queryClient.invalidateQueries({ queryKey: ["companies"] });
  };

  const syncDeleteCompany = async (id: bigint): Promise<void> => {
    const currentActor = actorRef.current;
    if (!currentActor) throw new Error("Actor not available");
    await currentActor.deleteCompany(id);
    store.deleteCompany(id);
    queryClient.invalidateQueries({ queryKey: ["companies"] });
  };

  const syncCreateMaterial = async (input: MaterialInput): Promise<bigint> => {
    const currentActor = actorRef.current;
    if (!currentActor) throw new Error("Actor not available");
    const id = await currentActor.createMaterial(input);
    const material: Material = { id, ...input };
    store.addMaterial(material);
    queryClient.invalidateQueries({ queryKey: ["materials"] });
    return id;
  };

  const syncUpdateMaterial = async (
    id: bigint,
    input: MaterialInput,
  ): Promise<void> => {
    const currentActor = actorRef.current;
    if (!currentActor) throw new Error("Actor not available");
    await currentActor.updateMaterial(id, input);
    const material: Material = { id, ...input };
    store.updateMaterial(material);
    queryClient.invalidateQueries({ queryKey: ["materials"] });
  };

  const syncDeleteMaterial = async (id: bigint): Promise<void> => {
    const currentActor = actorRef.current;
    if (!currentActor) throw new Error("Actor not available");
    await currentActor.deleteMaterial(id);
    store.deleteMaterial(id);
    queryClient.invalidateQueries({ queryKey: ["materials"] });
  };

  return {
    syncCreateSite,
    syncUpdateSite,
    syncDeleteSite,
    syncCreateGodown,
    syncUpdateGodown,
    syncDeleteGodown,
    syncCreateCompany,
    syncUpdateCompany,
    syncDeleteCompany,
    syncCreateMaterial,
    syncUpdateMaterial,
    syncDeleteMaterial,
  };
}

// ── Movement mutations ─────────────────────────────────────────────────────

export function useCreateMovement() {
  const { actor } = useActor();
  const actorRef = useRef(actor);
  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);
  const queryClient = useQueryClient();
  const addMovement = useStore((s) => s.addMovement);

  return useMutation({
    mutationFn: async (input: MovementInput) => {
      const currentActor = actorRef.current;
      if (!currentActor)
        throw new Error(
          "Backend is not connected. Please wait a moment and try again.",
        );
      const id = await currentActor.createMovement(input);
      return id;
    },
    onSuccess: async (id) => {
      const currentActor = actorRef.current;
      if (!currentActor) return;
      const movement = await currentActor.getMovement(id);
      if (movement) addMovement(movement);
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
  });
}

export function useUpdateMovement() {
  const { actor } = useActor();
  const actorRef = useRef(actor);
  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);
  const queryClient = useQueryClient();
  const updateMovement = useStore((s) => s.updateMovement);

  return useMutation({
    mutationFn: async ({
      id,
      quantity,
      source,
      destination,
      personName,
      costPerUnit,
      timestamp,
    }: {
      id: bigint;
      quantity: bigint;
      source: BasicLocation | null;
      destination: BasicLocation | null;
      personName: PersonInfo | null;
      costPerUnit: bigint | null;
      timestamp: bigint;
    }) => {
      const currentActor = actorRef.current;
      if (!currentActor)
        throw new Error(
          "Backend is not connected. Please wait a moment and try again.",
        );
      await currentActor.updateMovement(
        id,
        quantity,
        source,
        destination,
        personName,
        costPerUnit,
        timestamp,
      );
      return id;
    },
    onSuccess: async (id) => {
      const currentActor = actorRef.current;
      if (!currentActor) return;
      const movement = await currentActor.getMovement(id);
      if (movement) updateMovement(movement);
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
  });
}

export function useDeleteMovement() {
  const { actor } = useActor();
  const actorRef = useRef(actor);
  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);
  const queryClient = useQueryClient();
  const deleteMovement = useStore((s) => s.deleteMovement);

  return useMutation({
    mutationFn: async (id: bigint) => {
      const currentActor = actorRef.current;
      if (!currentActor)
        throw new Error(
          "Backend is not connected. Please wait a moment and try again.",
        );
      await currentActor.deleteMovement(id);
      return id;
    },
    onSuccess: (id) => {
      deleteMovement(id);
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["materialsWithStockInfo"] });
    },
  });
}

// ── Note mutations ─────────────────────────────────────────────────────────

export function useCreateNote() {
  const { actor } = useActor();
  const actorRef = useRef(actor);
  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);
  const queryClient = useQueryClient();
  const addNote = useStore((s) => s.addNote);

  return useMutation({
    mutationFn: async (input: NoteInput) => {
      const currentActor = actorRef.current;
      if (!currentActor) throw new Error("Actor not available");
      return currentActor.createNote(input);
    },
    onSuccess: async (id) => {
      const currentActor = actorRef.current;
      if (!currentActor) return;
      const note = await currentActor.getNote(id);
      if (note) addNote(note);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useUpdateNote() {
  const { actor } = useActor();
  const actorRef = useRef(actor);
  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);
  const queryClient = useQueryClient();
  const updateNote = useStore((s) => s.updateNote);

  return useMutation({
    mutationFn: async ({ id, input }: { id: bigint; input: NoteInput }) => {
      const currentActor = actorRef.current;
      if (!currentActor) throw new Error("Actor not available");
      await currentActor.updateNote(id, input);
      return id;
    },
    onSuccess: async (id) => {
      const currentActor = actorRef.current;
      if (!currentActor) return;
      const note = await currentActor.getNote(id);
      if (note) updateNote(note);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useDeleteNote() {
  const { actor } = useActor();
  const actorRef = useRef(actor);
  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);
  const queryClient = useQueryClient();
  const deleteNote = useStore((s) => s.deleteNote);

  return useMutation({
    mutationFn: async (id: bigint) => {
      const currentActor = actorRef.current;
      if (!currentActor) throw new Error("Actor not available");
      await currentActor.deleteNote(id);
      return id;
    },
    onSuccess: (id) => {
      deleteNote(id);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}
