import { PublicForm } from "@/components/PublicForm";

export default async function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PublicForm slug={slug} />;
}
