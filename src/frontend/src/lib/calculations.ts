import type { Company, Godown, Material, Movement, Site } from "../backend";
import { LocationType, MovementType } from "../backend";

/** Returns true for opening stock entries (added directly inside a location, not a real transfer) */
export function isOpeningStock(m: Movement): boolean {
  return m.movementType === MovementType.outStockCheck;
}

/** Returns only real transfer movements (excluding opening stock entries) */
export function filterRealMovements(movements: Movement[]): Movement[] {
  return movements.filter((m) => !isOpeningStock(m));
}

export function formatCurrency(amount: number | bigint): string {
  const num = typeof amount === "bigint" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatMovementDate(timestamp: bigint): string {
  if (!timestamp || timestamp === 0n) return "Unknown date";
  const ms = Number(timestamp) / 1_000_000;
  if (ms < 1_000_000_000_000) return "Unknown date";
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatMovementDateTime(timestamp: bigint): string {
  if (!timestamp || timestamp === 0n) return "Unknown date";
  const ms = Number(timestamp) / 1_000_000;
  if (ms < 1_000_000_000_000) return "Unknown date";
  const d = new Date(ms);
  const datePart = d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timePart = d
    .toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();
  return `${datePart} – ${timePart}`;
}

export function getLocationName(
  location: { id: bigint; type: LocationType } | undefined,
  sites: Site[],
  godowns: Godown[],
  companies: Company[],
): string {
  if (!location) return "—";
  if (location.type === LocationType.site) {
    return (
      sites.find((s) => s.id === location.id)?.name ?? `Site #${location.id}`
    );
  }
  if (location.type === LocationType.godown) {
    return (
      godowns.find((g) => g.id === location.id)?.name ??
      `Godown #${location.id}`
    );
  }
  if (location.type === LocationType.company) {
    return (
      companies.find((c) => c.id === location.id)?.name ??
      `Company #${location.id}`
    );
  }
  return "—";
}

export function getLocationTypeLabel(type: LocationType | undefined): string {
  if (type === LocationType.site) return "Site";
  if (type === LocationType.godown) return "Godown";
  if (type === LocationType.company) return "Company";
  return "";
}

export interface MaterialAggregate {
  material: Material;
  totalIn: number;
  totalOut: number;
  available: number;
  totalValue: number;
}

export function computeMaterialAggregate(
  material: Material,
  movements: Movement[],
): MaterialAggregate {
  let totalIn = 0;
  let totalOut = 0;
  for (const m of movements) {
    if (m.materialId !== material.id) continue;
    if (m.destination) totalIn += Number(m.quantity);
    if (m.source) totalOut += Number(m.quantity);
  }
  const available = Math.max(0, totalIn - totalOut);
  const cost = Number(material.costPerUnit ?? 0n);
  return {
    material,
    totalIn,
    totalOut,
    available,
    totalValue: available * cost,
  };
}

export interface MaterialOverview {
  material: Material;
  totalIn: number;
  totalOut: number;
  available: number;
  totalValue: number;
  locationBreakdown: Array<{
    locationId: bigint;
    locationType: LocationType;
    locationName: string;
    available: number;
    value: number;
  }>;
}

export function computeMaterialOverview(
  material: Material,
  movements: Movement[],
  sites: Site[],
  godowns: Godown[],
  companies: Company[],
): MaterialOverview {
  const locationMap = new Map<
    string,
    {
      locationId: bigint;
      locationType: LocationType;
      locationName: string;
      inQty: number;
      outQty: number;
    }
  >();

  for (const m of movements) {
    if (m.materialId !== material.id) continue;
    if (m.destination) {
      const key = `${m.destination.type}-${m.destination.id}`;
      if (!locationMap.has(key)) {
        locationMap.set(key, {
          locationId: m.destination.id,
          locationType: m.destination.type,
          locationName: getLocationName(
            m.destination,
            sites,
            godowns,
            companies,
          ),
          inQty: 0,
          outQty: 0,
        });
      }
      locationMap.get(key)!.inQty += Number(m.quantity);
    }
    if (m.source) {
      const key = `${m.source.type}-${m.source.id}`;
      if (!locationMap.has(key)) {
        locationMap.set(key, {
          locationId: m.source.id,
          locationType: m.source.type,
          locationName: getLocationName(m.source, sites, godowns, companies),
          inQty: 0,
          outQty: 0,
        });
      }
      locationMap.get(key)!.outQty += Number(m.quantity);
    }
  }

  let totalIn = 0;
  let totalOut = 0;
  const locationBreakdown = Array.from(locationMap.values()).map((loc) => {
    const available = Math.max(0, loc.inQty - loc.outQty);
    totalIn += loc.inQty;
    totalOut += loc.outQty;
    return {
      locationId: loc.locationId,
      locationType: loc.locationType,
      locationName: loc.locationName,
      available,
      value: available * Number(material.costPerUnit ?? 0n),
    };
  });

  const available = Math.max(0, totalIn - totalOut);
  return {
    material,
    totalIn,
    totalOut,
    available,
    totalValue: available * Number(material.costPerUnit ?? 0n),
    locationBreakdown,
  };
}

export interface CompanyDetail {
  company: Company;
  materialStats: Array<{
    material: Material;
    sent: number;
    returned: number;
    net: number;
    value: number;
  }>;
  totalValue: number;
}

export function computeCompanyDetail(
  company: Company,
  movements: Movement[],
  materials: Material[],
): CompanyDetail {
  const statsMap = new Map<bigint, { sent: number; returned: number }>();

  for (const m of movements) {
    if (m.source?.type === LocationType.company && m.source.id === company.id) {
      if (!statsMap.has(m.materialId))
        statsMap.set(m.materialId, { sent: 0, returned: 0 });
      statsMap.get(m.materialId)!.sent += Number(m.quantity);
    }
    if (
      m.destination?.type === LocationType.company &&
      m.destination.id === company.id
    ) {
      if (!statsMap.has(m.materialId))
        statsMap.set(m.materialId, { sent: 0, returned: 0 });
      statsMap.get(m.materialId)!.returned += Number(m.quantity);
    }
  }

  let totalValue = 0;
  const materialStats = materials
    .filter((mat) => statsMap.has(mat.id))
    .map((mat) => {
      const stat = statsMap.get(mat.id)!;
      const net = stat.sent - stat.returned;
      const value = Math.max(0, net) * Number(mat.costPerUnit ?? 0n);
      totalValue += value;
      return {
        material: mat,
        sent: stat.sent,
        returned: stat.returned,
        net,
        value,
      };
    });

  return { company, materialStats, totalValue };
}

export function computeDashboardTotals(
  movements: Movement[],
  materials: Material[],
) {
  let totalStockValue = 0;
  for (const mat of materials) {
    let totalIn = 0;
    let totalOut = 0;
    for (const m of movements) {
      if (m.materialId !== mat.id) continue;
      if (m.destination) totalIn += Number(m.quantity);
      if (m.source) totalOut += Number(m.quantity);
    }
    const available = Math.max(0, totalIn - totalOut);
    totalStockValue += available * Number(mat.costPerUnit ?? 0n);
  }
  return { totalStockValue };
}

export function computeLocationStock(
  locationId: bigint,
  locationType: LocationType,
  movements: Movement[],
  materials: Material[],
): Array<{ material: Material; available: number; value: number }> {
  return materials
    .map((mat) => {
      let totalIn = 0;
      let totalOut = 0;
      for (const m of movements) {
        if (m.materialId !== mat.id) continue;
        if (
          m.destination &&
          m.destination.id === locationId &&
          m.destination.type === locationType
        ) {
          totalIn += Number(m.quantity);
        }
        if (
          m.source &&
          m.source.id === locationId &&
          m.source.type === locationType
        ) {
          totalOut += Number(m.quantity);
        }
      }
      const available = Math.max(0, totalIn - totalOut);
      return {
        material: mat,
        available,
        value: available * Number(mat.costPerUnit ?? 0n),
      };
    })
    .filter((s) => s.available > 0);
}

export function computeLocationTotalValue(
  locationId: bigint,
  locationType: LocationType,
  movements: Movement[],
  materials: Material[],
): number {
  let total = 0;
  for (const mat of materials) {
    let totalIn = 0;
    let totalOut = 0;
    for (const m of movements) {
      if (m.materialId !== mat.id) continue;
      if (
        m.destination &&
        m.destination.id === locationId &&
        m.destination.type === locationType
      ) {
        totalIn += Number(m.quantity);
      }
      if (
        m.source &&
        m.source.id === locationId &&
        m.source.type === locationType
      ) {
        totalOut += Number(m.quantity);
      }
    }
    const available = Math.max(0, totalIn - totalOut);
    total += available * Number(mat.costPerUnit ?? 0n);
  }
  return total;
}
