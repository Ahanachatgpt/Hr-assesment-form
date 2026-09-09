export type FieldType =
  | "section"
  | "text"
  | "email"
  | "tel"
  | "number"
  | "date"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "yesno"
  | "file"
  | "repeater";

export type FieldWidth = "full" | "half" | "third" | "quarter";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: string[];
  width?: FieldWidth;
  repeaterFields?: FormField[];
  accept?: string;
  defaultRows?: Record<string, unknown>[];
  followUpWhen?: string;
  followUpExcept?: string[];
  followUpLabel?: string;
  followUpPlaceholder?: string;
  multiple?: boolean;
  hideDay?: boolean;
}

export type RatingLevel = "Excellent" | "Very good" | "Good" | "Fair" | "Poor";

export interface RatingRow {
  criterion: string;
  rating: RatingLevel | "";
  remarks: string;
}

export interface HrReview {
  hrRatings: RatingRow[];
  functionalHead: string;
  hrSignature: string;
  hodRatings: RatingRow[];
  hodSignature: string;
  designation: string;
  location: string;
  dateOfJoining: string;
  salary: string;
  probationPeriod: string;
  reviewDate: string;
  managementRemarks: string;
  managementApproval: string;
  updatedAt?: string;
}

export interface AssessmentForm {
  id: string;
  title: string;
  slug: string;
  description: string;
  instructions: string;
  department: string;
  status: "draft" | "published" | "archived";
  fields: FormField[];
  notifyEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExtraDoc {
  path: string;
  name: string;
  mime: string;
}

export interface Submission {
  id: string;
  formId: string;
  formTitle: string;
  formSlug: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  answers: Record<string, unknown>;
  resumePath?: string;
  resumeName?: string;
  resumeMime?: string;
  photoPath?: string;
  photoName?: string;
  extraDocs?: ExtraDoc[];
  pdfPath?: string;
  hrReview?: HrReview;
  emailStatus: "pending" | "sent" | "failed" | "not_configured" | "skipped";
  emailError?: string;
  emailedTo?: string;
  createdAt: string;
}

export interface AppSettings {
  companyName: string;
  companyTagline: string;
  supportEmail: string;
  notifyEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpSecure: boolean;
  smtpFromName: string;
  smtpFromEmail: string;
}

export interface AdminAccount {
  username: string;
  passwordHash: string;
}

export interface SessionData {
  isLoggedIn: boolean;
  username: string;
}

export interface Database {
  settings: AppSettings;
  admin: AdminAccount;
  forms: AssessmentForm[];
  submissions: Submission[];
}
