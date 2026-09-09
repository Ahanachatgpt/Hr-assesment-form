import { FormBuilder } from "@/components/FormBuilder";

export default async function FormEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FormBuilder formId={id} />;
}
