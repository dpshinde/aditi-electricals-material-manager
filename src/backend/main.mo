import Nat "mo:core/Nat";
import Time "mo:core/Time";
import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";



actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // ── Types ─────────────────────────────────────────────────────────────
  public type UserProfile = {
    name : Text;
    email : ?Text;
  };

  public type LocationType = { #site; #godown; #company };

  public type BasicLocation = {
    type_ : LocationType;
    id : Nat;
  };

  public type Material = {
    id : Nat;
    name : Text;
    unit : Text;
    costPerUnit : ?Nat;
  };

  public type MaterialInput = {
    name : Text;
    unit : Text;
    costPerUnit : ?Nat;
  };

  public type MaterialWithStockInfo = {
    material : Material;
    totalIn : Nat;
    totalOut : Nat;
    availableStock : Nat;
    totalValue : Nat;
  };

  public type Direction = { #from; #to };
  public type PersonDirection = { #direction : Direction; #responsible };

  public type MovementType = {
    #fromTo;
    #outStockCheck;
  };

  public type PersonInfo = {
    direction : PersonDirection;
    name : Text;
  };

  public type Godown = {
    id : Nat;
    name : Text;
    location : ?Text;
  };

  public type Company = {
    id : Nat;
    name : Text;
  };

  public type Site = {
    id : Nat;
    name : Text;
    location : ?Text;
  };

  public type Movement = {
    id : Nat;
    materialId : Nat;
    movementType : MovementType;
    quantity : Nat;
    source : ?BasicLocation;
    destination : ?BasicLocation;
    personName : ?PersonInfo;
    companyId : ?Nat;
    costPerUnit : ?Nat;
    timestamp : Int;
    createdAt : Int;
  };

  public type MovementInput = {
    materialId : Nat;
    movementType : MovementType;
    quantity : Nat;
    source : ?BasicLocation;
    destination : ?BasicLocation;
    personName : ?PersonInfo;
    companyId : ?Nat;
    costPerUnit : ?Nat;
    timestamp : Int;
  };

  public type Note = {
    id : Nat;
    title : Text;
    description : Text;
    date : Int;
    relatedLocation : ?BasicLocation;
    relatedPersonName : ?Text;
    photos : [Storage.ExternalBlob];
  };

  public type NoteInput = {
    title : Text;
    description : Text;
    relatedLocation : ?BasicLocation;
    relatedPersonName : ?Text;
    photos : [Storage.ExternalBlob];
  };

  // ── State ─────────────────────────────────────────────────────────────
  var nextId = 1;
  let sites = Map.empty<Nat, Site>();
  let godowns = Map.empty<Nat, Godown>();
  let companies = Map.empty<Nat, Company>();
  let materials = Map.empty<Nat, Material>();
  let movements = Map.empty<Nat, Movement>();
  let notes = Map.empty<Nat, Note>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // ── Helper Functions ─────────────────────────────────────────────———
  func generateId() : Nat {
    let currentId = nextId;
    nextId += 1;
    currentId;
  };

  func getCostOrZero(cost : ?Nat) : Nat {
    switch (cost) {
      case (null) { 0 };
      case (?n) { n };
    };
  };

  func getAvailableStock(materialId : Nat, location : BasicLocation) : Nat {
    var totalIn = 0;
    var totalOut = 0;

    for (movement in movements.values()) {
      if (movement.materialId == materialId) {
        switch (movement.destination) {
          case (?dest) {
            if (dest.id == location.id and dest.type_ == location.type_) {
              totalIn += movement.quantity;
            };
          };
          case (_) {};
        };
        switch (movement.source) {
          case (?src) {
            if (src.id == location.id and src.type_ == location.type_) {
              totalOut += movement.quantity;
            };
          };
          case (_) {};
        };
      };
    };
    if (totalIn >= totalOut) { totalIn - totalOut } else { 0 };
  };

  func validateLocations(source : ?BasicLocation, destination : ?BasicLocation) {
    switch (source, destination) {
      case (?s, ?d) {
        if (s.id == d.id and s.type_ == d.type_) {
          Runtime.trap("Source and destination cannot be the same");
        };
      };
      case (_, _) {};
    };
    validateLocation(source, "source");
    validateLocation(destination, "destination");
  };

  func validateLocation(location : ?BasicLocation, reference : Text) {
    switch (location) {
      case (?loc) {
        switch (loc.type_) {
          case (#site) { verifySite(loc.id, reference) };
          case (#godown) { verifyGodown(loc.id, reference) };
          case (#company) { verifyCompany(loc.id, reference) };
        };
      };
      case (_) {};
    };
  };

  func verifySite(locationId : Nat, reference : Text) {
    if (sites.get(locationId) == null) {
      Runtime.trap(reference # " Site not found: " # locationId.toText());
    };
  };

  func verifyGodown(locationId : Nat, reference : Text) {
    if (godowns.get(locationId) == null) {
      Runtime.trap(reference # " Godown not found: " # locationId.toText());
    };
  };

  func verifyCompany(locationId : Nat, reference : Text) {
    if (companies.get(locationId) == null) {
      Runtime.trap(reference # " Company not found: " # locationId.toText());
    };
  };

  // ── User Profiles ─────────────────────────────────────────────────────
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ── Sites ─────────────────────────────────────────────────────────────
  public shared ({ caller }) func createSite(name : Text, location : ?Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create sites");
    };
    let id = generateId();
    let site : Site = { id; name; location };
    sites.add(id, site);
    id;
  };

  public shared ({ caller }) func updateSite(id : Nat, name : Text, location : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update sites");
    };
    switch (sites.get(id)) {
      case (null) { Runtime.trap("Site not found: " # id.toText()) };
      case (?_) {
        let updated : Site = { id; name; location };
        sites.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteSite(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete sites");
    };
    switch (sites.get(id)) {
      case (null) { Runtime.trap("Site not found: " # id.toText()) };
      case (?_) { sites.remove(id) };
    };
  };

  public query ({ caller }) func getSites() : async [Site] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sites");
    };
    sites.values().toArray();
  };

  public query ({ caller }) func getSite(id : Nat) : async ?Site {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sites");
    };
    sites.get(id);
  };

  // ── Godowns ───────────────────────────────────────────────────────────
  public shared ({ caller }) func createGodown(name : Text, location : ?Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create godowns");
    };
    let id = generateId();
    let godown : Godown = { id; name; location };
    godowns.add(id, godown);
    id;
  };

  public shared ({ caller }) func updateGodown(id : Nat, name : Text, location : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update godowns");
    };
    switch (godowns.get(id)) {
      case (null) { Runtime.trap("Godown not found: " # id.toText()) };
      case (?_) {
        let updated : Godown = { id; name; location };
        godowns.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteGodown(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete godowns");
    };
    switch (godowns.get(id)) {
      case (null) { Runtime.trap("Godown not found: " # id.toText()) };
      case (?_) { godowns.remove(id) };
    };
  };

  public query ({ caller }) func getGodowns() : async [Godown] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view godowns");
    };
    godowns.values().toArray();
  };

  public query ({ caller }) func getGodown(id : Nat) : async ?Godown {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view godowns");
    };
    godowns.get(id);
  };

  // ── Companies ──────────────────────────────────────────────────────────
  public shared ({ caller }) func createCompany(name : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create companies");
    };
    let id = generateId();
    let company : Company = { id; name };
    companies.add(id, company);
    id;
  };

  public shared ({ caller }) func updateCompany(id : Nat, name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update companies");
    };
    switch (companies.get(id)) {
      case (null) { Runtime.trap("Company not found: " # id.toText()) };
      case (?_) {
        let updated : Company = { id; name };
        companies.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteCompany(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete companies");
    };
    switch (companies.get(id)) {
      case (null) { Runtime.trap("Company not found: " # id.toText()) };
      case (?_) { companies.remove(id) };
    };
  };

  public query ({ caller }) func getCompanies() : async [Company] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view companies");
    };
    companies.values().toArray();
  };

  public query ({ caller }) func getCompany(id : Nat) : async ?Company {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view companies");
    };
    companies.get(id);
  };

  // ── Materials ────────────────────────────────────────────────────────
  public shared ({ caller }) func createMaterial(input : MaterialInput) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create materials");
    };
    let id = generateId();
    let material : Material = { id; name = input.name; unit = input.unit; costPerUnit = input.costPerUnit };
    materials.add(id, material);
    id;
  };

  public shared ({ caller }) func updateMaterial(id : Nat, input : MaterialInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update materials");
    };
    switch (materials.get(id)) {
      case (null) { Runtime.trap("Material not found: " # id.toText()) };
      case (?_) {
        let updated : Material = { id; name = input.name; unit = input.unit; costPerUnit = input.costPerUnit };
        materials.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteMaterial(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete materials");
    };
    switch (materials.get(id)) {
      case (null) { Runtime.trap("Material not found: " # id.toText()) };
      case (?_) { materials.remove(id) };
    };
  };

  public query ({ caller }) func getMaterials() : async [Material] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view materials");
    };
    materials.values().toArray();
  };

  public query ({ caller }) func getMaterial(id : Nat) : async ?Material {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view materials");
    };
    materials.get(id);
  };

  public query ({ caller }) func getMaterialsWithStockInfo() : async [MaterialWithStockInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view materials");
    };
    var result = List.empty<MaterialWithStockInfo>();
    for (material in materials.values()) {
      var totalIn = 0;
      var totalOut = 0;
      for (movement in movements.values()) {
        if (movement.materialId == material.id) {
          switch (movement.destination) {
            case (?_) { totalIn += movement.quantity };
            case (_) {};
          };
          switch (movement.source) {
            case (?_) { totalOut += movement.quantity };
            case (_) {};
          };
        };
      };
      let available = if (totalIn >= totalOut) { totalIn - totalOut } else { 0 };
      let info : MaterialWithStockInfo = {
        material;
        totalIn;
        totalOut;
        availableStock = available;
        totalValue = available * getCostOrZero(material.costPerUnit);
      };
      result.add(info);
    };
    result.toArray();
  };

  // ── Movements ───────────────────────────────────────────────────────
  public shared ({ caller }) func createMovement(input : MovementInput) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create movements");
    };
    switch (materials.get(input.materialId)) {
      case (null) { Runtime.trap("Material not found") };
      case (?_) {};
    };

    validateLocations(input.source, input.destination);

    let id = generateId();
    let now = Time.now();
    let ts = if (input.timestamp != 0) { input.timestamp } else { now };
    let movement : Movement = {
      id;
      materialId = input.materialId;
      movementType = input.movementType;
      quantity = input.quantity;
      source = input.source;
      destination = input.destination;
      personName = input.personName;
      companyId = input.companyId;
      costPerUnit = input.costPerUnit;
      timestamp = ts;
      createdAt = now;
    };
    movements.add(id, movement);
    id;
  };

  public shared ({ caller }) func updateMovement(
    id : Nat,
    quantity : Nat,
    source : ?BasicLocation,
    destination : ?BasicLocation,
    personName : ?PersonInfo,
    costPerUnit : ?Nat,
    timestamp : Int,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update movements");
    };

    validateLocations(source, destination);

    switch (movements.get(id)) {
      case (null) { Runtime.trap("Movement not found") };
      case (?originalMovement) {
        let ts = if (timestamp != 0) { timestamp } else { originalMovement.timestamp };
        let updatedMovement : Movement = {
          originalMovement with
          quantity;
          source;
          destination;
          personName;
          costPerUnit;
          timestamp = ts;
        };
        movements.add(id, updatedMovement);
      };
    };
  };

  public shared ({ caller }) func deleteMovement(movementId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete movements");
    };
    switch (movements.get(movementId)) {
      case (null) { Runtime.trap("Movement not found") };
      case (?_) { movements.remove(movementId) };
    };
  };

  public query ({ caller }) func getMovements() : async [Movement] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view movements");
    };
    movements.values().toArray();
  };

  public query ({ caller }) func getMovement(id : Nat) : async ?Movement {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view movements");
    };
    movements.get(id);
  };

  public query ({ caller }) func getStockForLocation(location : BasicLocation) : async [(Nat, Nat)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view stock");
    };
    var result = List.empty<(Nat, Nat)>();
    for (material in materials.values()) {
      let stock = getAvailableStock(material.id, location);
      result.add((material.id, stock));
    };
    result.toArray();
  };

  // ── Notes ────────────────────────────────────────────────────────────
  public shared ({ caller }) func createNote(input : NoteInput) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create notes");
    };
    let id = generateId();
    let note : Note = {
      id;
      title = input.title;
      description = input.description;
      date = Time.now();
      relatedLocation = input.relatedLocation;
      relatedPersonName = input.relatedPersonName;
      photos = input.photos;
    };
    notes.add(id, note);
    id;
  };

  public shared ({ caller }) func updateNote(id : Nat, input : NoteInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update notes");
    };
    switch (notes.get(id)) {
      case (null) { Runtime.trap("Note not found: " # id.toText()) };
      case (?existing) {
        let updated : Note = {
          id;
          title = input.title;
          description = input.description;
          date = existing.date;
          relatedLocation = input.relatedLocation;
          relatedPersonName = input.relatedPersonName;
          photos = input.photos;
        };
        notes.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteNote(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete notes");
    };
    switch (notes.get(id)) {
      case (null) { Runtime.trap("Note not found: " # id.toText()) };
      case (?_) { notes.remove(id) };
    };
  };

  public query ({ caller }) func getNotes() : async [Note] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view notes");
    };
    notes.values().toArray();
  };

  public query ({ caller }) func getNote(id : Nat) : async ?Note {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view notes");
    };
    notes.get(id);
  };
};
