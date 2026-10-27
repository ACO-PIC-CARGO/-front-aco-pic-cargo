export type PhaseStatus = "completed" | "in_progress" | "pending";
export type StepState = "confirmed" | "next" | "blocked";

export interface HouseTrackingComment {
  id: number;
  comment: string;
  sent_at: string | null;
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
  sent_at: string | null;
  scheduled_at: string | null;
  validation: { code: string; name: string } | null;
  validation_result: WeightCheckResult | null;
  validation_result_code: string | null;
  quote_validity: QuoteValidity | null;
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

export type SendState = "internal" | "blocked" | "ready" | "sent";

export type StepDialogMode = "date" | "confirm";

export interface WeightCheck {
  weight: number;
  volume: number;
}

export interface WeightCheckResult extends WeightCheck {
  quoted_weight: number | null;
  quoted_volume: number | null;
}

export interface QuoteValidity {
  quote_id: number;
  valid_until: string;
  kept_by: string | null;
  kept_at: string | null;
}
