export interface Vehicle {
  id: string;
  make: string;
  model: string;
  variant: string | null;
  manufacturingYear: number;
  registrationNumber?: string | null;
  vin?: string | null;
  engineType: string | null;
  fuelType: string | null;
  transmission: string | null;
  currentMileage: number;
  purchaseDate: string | null;
  purchaseMileage: number | null;
  nickname: string | null;
  currency: string;
  isDemo: boolean;
  createdAt: string;
  _count?: { problems: number; services: number };
}

export interface Health {
  currentMileage: number;
  kmSinceLastService: number | null;
  lastServiceDate: string | null;
  openProblems: number;
  resolvedProblems: number;
  partsReplaced: number;
  diagnosticEvents: number;
  averageFuelEconomy: number | null;
  fuelSampleSize: number;
  maintenanceSpending: number;
}

export interface TimelineEvent {
  id: string;
  type: string;
  date: string;
  mileage: number | null;
  title: string;
  summary: string | null;
  detail: Record<string, unknown>;
}

export interface Memory {
  id: string;
  vehicleId: string;
  memoryType: string;
  title: string;
  content: string;
  eventDate: string;
  mileage: number | null;
  sourceType: string;
  sourceId: string | null;
  confidence: number;
  verificationStatus:
    | "confirmed"
    | "user_reported"
    | "imported"
    | "unverified"
    | "ai_inferred";
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult extends Omit<Memory, "vehicleId" | "confidence" | "createdAt" | "updatedAt" | "sourceId"> {
  sourceId?: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  retrievedMemoryIds: string[];
  suggestedMemory: SuggestedMemory | null;
  createdAt: string;
}

export interface SuggestedMemory {
  memoryType: string;
  title: string;
  content: string;
  eventDate: string;
  mileage: number | null;
}

export interface Reminder {
  id: string;
  title: string;
  description: string | null;
  dueType: string;
  dueMileage: number | null;
  dueDate: string | null;
  status: "overdue" | "due_soon" | "scheduled";
  remainingKm: number | null;
  daysRemaining: number | null;
  isEstimate: boolean;
  sourceNote: string | null;
}

export interface ServiceRecord {
  id: string;
  serviceDate: string;
  mileage: number;
  serviceCenter: string | null;
  serviceType: string;
  workPerformed: string | null;
  technicianNotes: string | null;
  cost: string | null;
  nextServiceDate: string | null;
  nextServiceMileage: number | null;
}

export interface Problem {
  id: string;
  reportedDate: string;
  mileage: number;
  symptom: string;
  location: string | null;
  severity: string | null;
  frequency: string | null;
  drivingConditions: string | null;
  initialDiagnosis: string | null;
  confirmedDiagnosis: string | null;
  repair: string | null;
  partsReplaced: string | null;
  resolution: string | null;
  resolutionStatus: string;
  isRecurrence: boolean;
  notes: string | null;
}

export interface Part {
  id: string;
  partName: string;
  partCategory: string | null;
  manufacturer: string | null;
  partNumber: string | null;
  installDate: string;
  installMileage: number;
  replacementDate: string | null;
  replacementMileage: number | null;
  reason: string | null;
  cost: string | null;
  warrantyMonths: number | null;
  expectedLifespanKm: number | null;
  symptomsBefore: string | null;
  resultAfter: string | null;
  notes: string | null;
  currentlyInstalled: boolean;
  lifetimeKm?: number | null;
  lifetimeMonths?: number | null;
}

export interface Diagnostic {
  id: string;
  date: string;
  mileage: number | null;
  obdCode: string | null;
  description: string | null;
  technicianNotes: string | null;
  scannerResults: string | null;
  diagnosis: string | null;
  repair: string | null;
  resolution: string | null;
  cost: string | null;
}

export interface FuelRecord {
  id: string;
  date: string;
  mileage: number;
  fuelQuantity: string;
  fuelCost: string;
  fuelType: string;
  distanceTravelled: string | null;
  fuelEconomy: string | null;
  drivingType: string | null;
  notes: string | null;
}

export interface VehicleDocument {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  docType: string;
  serviceDate: string | null;
  mileage: number | null;
  uploadedAt: string;
  extractions?: Array<{
    id: string;
    extractedType: string | null;
    aiConfidence: number | null;
    confirmedAt: string | null;
  }>;
}
