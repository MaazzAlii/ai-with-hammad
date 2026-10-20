import { AdminPageHeader } from "@/components/admin/page-header";
import { KnowledgeManager } from "@/components/admin/knowledge-manager";
import { can, requirePagePermission } from "@/server/auth/session";
import { getAdminKnowledgeData } from "@/server/dal/admin/knowledge";

export const metadata = { title: "AI Knowledge Base" };

export default async function KnowledgePage() {
  const staff = await requirePagePermission("settings.write");
  const data = await getAdminKnowledgeData();
  const canWrite = can(staff, "settings.write");

  return (
    <>
      <AdminPageHeader
        title="AI Knowledge Base"
        description="Manage the Retrieval-Augmented Generation (RAG) vector database and content index powering the website chatbot."
      />
      <KnowledgeManager initialData={data} canWrite={canWrite} />
    </>
  );
}
