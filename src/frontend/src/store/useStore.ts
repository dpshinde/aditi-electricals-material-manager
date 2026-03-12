import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Company,
  Godown,
  Material,
  Movement,
  Note,
  Site,
} from "../backend";

interface AppStore {
  sites: Site[];
  godowns: Godown[];
  companies: Company[];
  materials: Material[];
  movements: Movement[];
  notes: Note[];

  setSites: (sites: Site[]) => void;
  setGodowns: (godowns: Godown[]) => void;
  setCompanies: (companies: Company[]) => void;
  setMaterials: (materials: Material[]) => void;
  setMovements: (movements: Movement[]) => void;
  setNotes: (notes: Note[]) => void;

  addSite: (site: Site) => void;
  updateSite: (site: Site) => void;
  deleteSite: (id: bigint) => void;

  addGodown: (godown: Godown) => void;
  updateGodown: (godown: Godown) => void;
  deleteGodown: (id: bigint) => void;

  addCompany: (company: Company) => void;
  updateCompany: (company: Company) => void;
  deleteCompany: (id: bigint) => void;

  addMaterial: (material: Material) => void;
  updateMaterial: (material: Material) => void;
  deleteMaterial: (id: bigint) => void;

  addMovement: (movement: Movement) => void;
  updateMovement: (movement: Movement) => void;
  deleteMovement: (id: bigint) => void;

  addNote: (note: Note) => void;
  updateNote: (note: Note) => void;
  deleteNote: (id: bigint) => void;
}

function bigintReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") return { __bigint__: value.toString() };
  return value;
}

function bigintReviver(_key: string, value: unknown): unknown {
  if (value && typeof value === "object" && "__bigint__" in (value as object)) {
    return BigInt((value as { __bigint__: string }).__bigint__);
  }
  return value;
}

const bigintStorage = {
  getItem: (name: string) => {
    const str = localStorage.getItem(name);
    if (!str) return null;
    return JSON.parse(str, bigintReviver);
  },
  setItem: (name: string, value: unknown) => {
    localStorage.setItem(name, JSON.stringify(value, bigintReplacer));
  },
  removeItem: (name: string) => localStorage.removeItem(name),
};

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      sites: [],
      godowns: [],
      companies: [],
      materials: [],
      movements: [],
      notes: [],

      setSites: (sites) => set({ sites }),
      setGodowns: (godowns) => set({ godowns }),
      setCompanies: (companies) => set({ companies }),
      setMaterials: (materials) => set({ materials }),
      setMovements: (movements) => set({ movements }),
      setNotes: (notes) => set({ notes }),

      addSite: (site) =>
        set((s) => ({
          sites: [...s.sites.filter((x) => x.id !== site.id), site],
        })),
      updateSite: (site) =>
        set((s) => ({
          sites: s.sites.map((x) => (x.id === site.id ? site : x)),
        })),
      deleteSite: (id) =>
        set((s) => ({ sites: s.sites.filter((x) => x.id !== id) })),

      addGodown: (godown) =>
        set((s) => ({
          godowns: [...s.godowns.filter((x) => x.id !== godown.id), godown],
        })),
      updateGodown: (godown) =>
        set((s) => ({
          godowns: s.godowns.map((x) => (x.id === godown.id ? godown : x)),
        })),
      deleteGodown: (id) =>
        set((s) => ({ godowns: s.godowns.filter((x) => x.id !== id) })),

      addCompany: (company) =>
        set((s) => ({
          companies: [
            ...s.companies.filter((x) => x.id !== company.id),
            company,
          ],
        })),
      updateCompany: (company) =>
        set((s) => ({
          companies: s.companies.map((x) =>
            x.id === company.id ? company : x,
          ),
        })),
      deleteCompany: (id) =>
        set((s) => ({ companies: s.companies.filter((x) => x.id !== id) })),

      addMaterial: (material) =>
        set((s) => ({
          materials: [
            ...s.materials.filter((x) => x.id !== material.id),
            material,
          ],
        })),
      updateMaterial: (material) =>
        set((s) => ({
          materials: s.materials.map((x) =>
            x.id === material.id ? material : x,
          ),
        })),
      deleteMaterial: (id) =>
        set((s) => ({ materials: s.materials.filter((x) => x.id !== id) })),

      addMovement: (movement) =>
        set((s) => ({
          movements: [
            ...s.movements.filter((x) => x.id !== movement.id),
            movement,
          ],
        })),
      updateMovement: (movement) =>
        set((s) => ({
          movements: s.movements.map((x) =>
            x.id === movement.id ? movement : x,
          ),
        })),
      deleteMovement: (id) =>
        set((s) => ({ movements: s.movements.filter((x) => x.id !== id) })),

      addNote: (note) =>
        set((s) => ({
          notes: [...s.notes.filter((x) => x.id !== note.id), note],
        })),
      updateNote: (note) =>
        set((s) => ({
          notes: s.notes.map((x) => (x.id === note.id ? note : x)),
        })),
      deleteNote: (id) =>
        set((s) => ({ notes: s.notes.filter((x) => x.id !== id) })),
    }),
    {
      name: "aditi-store",
      storage: bigintStorage as Parameters<typeof persist>[1]["storage"],
    },
  ),
);

// Convenience selector hooks
export const useSites = () => useStore((s) => s.sites);
export const useGodowns = () => useStore((s) => s.godowns);
export const useCompanies = () => useStore((s) => s.companies);
export const useMaterials = () => useStore((s) => s.materials);
export const useMovements = () => useStore((s) => s.movements);
export const useNotes = () => useStore((s) => s.notes);
