/**
 * TypeScript mirrors of the Supabase schema (see supabase/migrations).
 * Hand-maintained; keep in sync with the SQL. snake_case matches column names.
 */
import type { PermitCategory } from "@/config/migri-2026";
import type { ServiceTier, Complexity, AddonId } from "@/lib/pricing";

export type AppRole = "user" | "admin";

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "docs_needed"
  | "ready"
  | "submitted_to_authority"
  | "decided"
  | "closed";

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined";
export type DocumentStatus = "pending" | "in_review" | "approved" | "fix_needed";
export type TxnType = "income" | "expense";
export type TxnStatus = "paid" | "pending";

export interface Profile {
  id: string;
  full_name: string | null;
  locale: string;
  country: string | null;
  role: AppRole;
  created_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  category: PermitCategory;
  tier: ServiceTier;
  complexity: Complexity;
  target_country: string;
  target_city: string | null;
  income_region: string | null;
  family_members: number;
  urgent: boolean;
  status: ApplicationStatus;
  reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteLineRow {
  key: string;
  amount: number;
}

export interface Quote {
  id: string;
  application_id: string;
  user_id: string;
  lines: QuoteLineRow[];
  subtotal_net: number;
  vat_rate: number;
  range_net_min: number;
  range_net_max: number;
  range_gross_min: number;
  range_gross_max: number;
  official_fee_min: number;
  official_fee_max: number;
  currency: string;
  status: QuoteStatus;
  created_at: string;
}

export interface DocumentRow {
  id: string;
  application_id: string;
  user_id: string;
  doc_type: string;
  file_name: string;
  storage_path: string;
  status: DocumentStatus;
  review_note: string | null;
  uploaded_at: string;
}

export interface Message {
  id: string;
  application_id: string;
  sender_id: string;
  sender_role: AppRole;
  body: string;
  attachments: unknown[];
  read_at: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: TxnType;
  application_id: string | null;
  category: string | null;
  amount: number;
  vat: number;
  currency: string;
  description: string | null;
  occurred_on: string;
  status: TxnStatus;
  created_at: string;
}

export interface ApplicationAddon {
  application_id: string;
  addon_id: AddonId;
}

export type DeadlineKind =
  | "permit_expiry"
  | "appointment"
  | "document_validity"
  | "submission"
  | "other";

export interface Deadline {
  id: string;
  application_id: string;
  user_id: string;
  kind: DeadlineKind;
  due_date: string; // YYYY-MM-DD
  note: string | null;
  done: boolean;
  created_at: string;
}
