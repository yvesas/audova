import { JobView } from "@/components/job-view";

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="min-h-screen">
      <JobView jobId={id} />
    </main>
  );
}
