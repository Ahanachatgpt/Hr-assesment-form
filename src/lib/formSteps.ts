import { FormField } from "./types";
import { isPhotoField } from "./utils";

export type FormStep = {
  id: string;
  title: string;
  fields: FormField[];
};

export function shortStepTitle(title: string): string {
  if (/candidate|applicant/i.test(title)) return "Personal";
  if (/education/i.test(title)) return "Education";
  if (/employment/i.test(title)) return "Experience";
  if (/training/i.test(title)) return "Training";
  if (/reference/i.test(title)) return "References";
  if (/family/i.test(title)) return "Family";
  if (/additional/i.test(title)) return "Additional";
  if (/document/i.test(title)) return "Documents";
  return title;
}

export function buildFormSteps(fields: FormField[]): FormStep[] {
  const steps: FormStep[] = [];
  let current: FormStep | null = null;

  const start = (id: string, title: string) => {
    current = { id, title, fields: [] };
    steps.push(current);
  };

  const docsTitle = "Documents";

  for (const field of fields) {
    const isDocFile = field.type === "file" && !isPhotoField(field);
    const isDeclaration = field.type === "checkbox" && /terms|declaration/i.test(field.label);

    if (field.type === "section") {
      start(field.id, field.label);
      continue;
    }

    if (field.type === "repeater") {
      start(field.id, field.label);
      current!.fields.push(field);
      continue;
    }

    if (isDocFile || isDeclaration) {
      let docs = steps.find((s) => s.title === docsTitle);
      if (!docs) {
        start("step_documents", docsTitle);
        docs = current!;
      }
      docs.fields.push(field);
      current = docs;
      continue;
    }

    if (!current) start(field.id, "Your details");
    current!.fields.push(field);
  }

  return steps.filter((s) => s.fields.length > 0);
}
