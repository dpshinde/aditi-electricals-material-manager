import { useMemo, useState } from "react";
import type { Movement } from "../backend";

export interface MovementFilters {
  dateStart: string;
  dateEnd: string;
  materialId: string;
  fromLocationType: string;
  fromLocationId: string;
  toLocationType: string;
  toLocationId: string;
  personName: string;
  companyId: string;
}

const defaultFilters: MovementFilters = {
  dateStart: "",
  dateEnd: "",
  materialId: "",
  fromLocationType: "",
  fromLocationId: "",
  toLocationType: "",
  toLocationId: "",
  personName: "",
  companyId: "",
};

export function useMovementFilters(movements: Movement[]) {
  const [filters, setFilters] = useState<MovementFilters>(defaultFilters);

  const filtered = useMemo(() => {
    return movements.filter((m) => {
      if (filters.materialId && m.materialId.toString() !== filters.materialId)
        return false;

      if (filters.dateStart) {
        const startMs = new Date(filters.dateStart).getTime();
        const mMs = Number(m.createdAt) / 1_000_000;
        if (mMs < startMs) return false;
      }

      if (filters.dateEnd) {
        const endMs = new Date(filters.dateEnd).getTime() + 86400000;
        const mMs = Number(m.createdAt) / 1_000_000;
        if (mMs > endMs) return false;
      }

      if (
        filters.fromLocationType &&
        m.source?.type !== filters.fromLocationType
      )
        return false;
      if (
        filters.fromLocationId &&
        m.source?.id.toString() !== filters.fromLocationId
      )
        return false;
      if (
        filters.toLocationType &&
        m.destination?.type !== filters.toLocationType
      )
        return false;
      if (
        filters.toLocationId &&
        m.destination?.id.toString() !== filters.toLocationId
      )
        return false;

      if (filters.companyId && m.companyId?.toString() !== filters.companyId)
        return false;

      if (filters.personName) {
        const name = m.personName?.name?.toLowerCase() ?? "";
        if (!name.includes(filters.personName.toLowerCase())) return false;
      }

      return true;
    });
  }, [movements, filters]);

  const updateFilter = (key: keyof MovementFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(defaultFilters);

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return { filters, filtered, updateFilter, resetFilters, hasActiveFilters };
}
