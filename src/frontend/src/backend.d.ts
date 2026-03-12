import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface BasicLocation {
    id: bigint;
    type: LocationType;
}
export interface PersonInfo {
    direction: PersonDirection;
    name: string;
}
export interface MaterialWithStockInfo {
    totalValue: bigint;
    totalIn: bigint;
    totalOut: bigint;
    availableStock: bigint;
    material: Material;
}
export type PersonDirection = {
    __kind__: "direction";
    direction: Direction;
} | {
    __kind__: "responsible";
    responsible: null;
};
export interface Company {
    id: bigint;
    name: string;
}
export interface MaterialInput {
    costPerUnit?: bigint;
    name: string;
    unit: string;
}
export interface Material {
    id: bigint;
    costPerUnit?: bigint;
    name: string;
    unit: string;
}
export interface Godown {
    id: bigint;
    name: string;
    location?: string;
}
export interface NoteInput {
    title: string;
    description: string;
    relatedPersonName?: string;
    relatedLocation?: BasicLocation;
    photos: Array<ExternalBlob>;
}
export interface Site {
    id: bigint;
    name: string;
    location?: string;
}
export interface MovementInput {
    destination?: BasicLocation;
    costPerUnit?: bigint;
    source?: BasicLocation;
    materialId: bigint;
    personName?: PersonInfo;
    movementType: MovementType;
    timestamp: bigint;
    quantity: bigint;
    companyId?: bigint;
}
export interface Movement {
    id: bigint;
    destination?: BasicLocation;
    costPerUnit?: bigint;
    source?: BasicLocation;
    createdAt: bigint;
    materialId: bigint;
    personName?: PersonInfo;
    movementType: MovementType;
    timestamp: bigint;
    quantity: bigint;
    companyId?: bigint;
}
export interface UserProfile {
    name: string;
    email?: string;
}
export interface Note {
    id: bigint;
    title: string;
    date: bigint;
    description: string;
    relatedPersonName?: string;
    relatedLocation?: BasicLocation;
    photos: Array<ExternalBlob>;
}
export enum Direction {
    to = "to",
    from = "from"
}
export enum LocationType {
    site = "site",
    godown = "godown",
    company = "company"
}
export enum MovementType {
    outStockCheck = "outStockCheck",
    fromTo = "fromTo"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCompany(name: string): Promise<bigint>;
    createGodown(name: string, location: string | null): Promise<bigint>;
    createMaterial(input: MaterialInput): Promise<bigint>;
    createMovement(input: MovementInput): Promise<bigint>;
    createNote(input: NoteInput): Promise<bigint>;
    createSite(name: string, location: string | null): Promise<bigint>;
    deleteCompany(id: bigint): Promise<void>;
    deleteGodown(id: bigint): Promise<void>;
    deleteMaterial(id: bigint): Promise<void>;
    deleteMovement(movementId: bigint): Promise<void>;
    deleteNote(id: bigint): Promise<void>;
    deleteSite(id: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompanies(): Promise<Array<Company>>;
    getCompany(id: bigint): Promise<Company | null>;
    getGodown(id: bigint): Promise<Godown | null>;
    getGodowns(): Promise<Array<Godown>>;
    getMaterial(id: bigint): Promise<Material | null>;
    getMaterials(): Promise<Array<Material>>;
    getMaterialsWithStockInfo(): Promise<Array<MaterialWithStockInfo>>;
    getMovement(id: bigint): Promise<Movement | null>;
    getMovements(): Promise<Array<Movement>>;
    getNote(id: bigint): Promise<Note | null>;
    getNotes(): Promise<Array<Note>>;
    getSite(id: bigint): Promise<Site | null>;
    getSites(): Promise<Array<Site>>;
    getStockForLocation(location: BasicLocation): Promise<Array<[bigint, bigint]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateCompany(id: bigint, name: string): Promise<void>;
    updateGodown(id: bigint, name: string, location: string | null): Promise<void>;
    updateMaterial(id: bigint, input: MaterialInput): Promise<void>;
    updateMovement(id: bigint, quantity: bigint, source: BasicLocation | null, destination: BasicLocation | null, personName: PersonInfo | null, costPerUnit: bigint | null, timestamp: bigint): Promise<void>;
    updateNote(id: bigint, input: NoteInput): Promise<void>;
    updateSite(id: bigint, name: string, location: string | null): Promise<void>;
}
