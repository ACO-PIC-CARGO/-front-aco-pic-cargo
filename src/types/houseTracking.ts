export type PhaseStatus = "completed" | "in_progress" | "pending";
export type StepState = "confirmed" | "next" | "blocked";

export interface HouseTrackingComment {
  id: number;
  comment: string;
  is_public: boolean;
  author: string | null;
  created_at: string;
}

export interface HouseTrackingStep {
  id: number;
  name: string;
  icon: string;
  number: number;
  visible_to_client: boolean;
  confirmed_at: string | null;
  confirmed_by: string | null;
  state: StepState;
  comments: HouseTrackingComment[];
}

export interface HouseTrackingPhase {
  id: number;
  name: string;
  icon: string;
  sort_order: number;
  status: PhaseStatus;
  completed_at: string | null;
  steps: HouseTrackingStep[];
}
