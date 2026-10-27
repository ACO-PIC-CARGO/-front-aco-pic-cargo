export type MoveDirection = "up" | "down";

export interface TrackingStep {
  id: number;
  name: string;
  icon: string;
  sort_order: number;
  number: number | null;
  visible_to_client: boolean;
  active: boolean;
  validation_id: number | null;
}

export interface TrackingPhase {
  id: number;
  name: string;
  icon: string;
  sort_order: number;
  active: boolean;
  first_step_number: number | null;
  last_step_number: number | null;
  steps: TrackingStep[];
}

export interface TrackingStepComment {
  id: number;
  comment: string;
}

export interface TrackingPhaseDraft {
  id: number | null;
  name: string;
  icon: string;
  active: boolean;
}

export interface TrackingStepDraft {
  id: number | null;
  phase_id: number | null;
  name: string;
  icon: string;
  visible_to_client: boolean;
  active: boolean;
  validation_id: number | null;
}

export interface TrackingValidation {
  id: number;
  code: string;
  name: string;
}
