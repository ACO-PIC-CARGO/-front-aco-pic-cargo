import type { PhaseStatus } from "@/types/houseTracking";

export interface PublicTrackingComment {
  id: number;
  comment: string;
  created_at: string;
}

export interface PublicTrackingStep {
  id: number;
  name: string;
  icon: string;
  confirmed_at: string | null;
  comments: PublicTrackingComment[];
}

export interface PublicTrackingPhase {
  id: number;
  name: string;
  icon: string;
  status: PhaseStatus;
  completed_at: string | null;
  progress: number;
  steps: PublicTrackingStep[];
}

export interface PublicTracking {
  house_code: string | null;
  client: string | null;
  supplier: string | null;
  incoterm: string | null;
  weight: number | null;
  volume: number | null;
  shipment: string | null;
  destination_port: string | null;
  eta: string | null;
  time_zone: string;
  phases: PublicTrackingPhase[];
}
