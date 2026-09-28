import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { useActivities } from "@/hooks/use-queries";
import { useCreateActivity } from "@/hooks/use-mutations";
import { useAuth } from "@/features/authentication/auth-context";
import { formatDate } from "@/lib/utils";
import type { Activity } from "@/types";

const columns: Column<Activity>[] = [
  { id: "title", header: "Title", cell: (row) => row.activityName },
  { id: "category", header: "Category", cell: (row) => row.category ?? "—" },
  { id: "date", header: "Date", cell: (row) => formatDate(row.date) },
  { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
];

export function CoordinatorActivitiesPage() {
  const { user } = useAuth();
  const { data = [], isLoading } = useActivities();
  const createActivity = useCreateActivity();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    communityImpact: "",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createActivity.mutateAsync({
        ...form,
        occurredAt: new Date().toISOString(),
        schoolId: user?.schoolId,
        coordinatorName: user?.name,
      });
      toast.success("Activity submitted");
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create activity");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activities"
        description="Create and manage school activities."
        actions={
          <Button onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-4 w-4" />
            Create Activity
          </Button>
        }
      />
      {showForm && (
        <Card className="p-5">
          <form onSubmit={onSubmit} className="grid gap-4">
            <div><Label>Title</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
            <div><Label>Community Impact</Label><Input value={form.communityImpact} onChange={(e) => setForm({ ...form, communityImpact: e.target.value })} /></div>
            <Button type="submit" loading={createActivity.isPending}>Submit Activity</Button>
          </form>
        </Card>
      )}
      <Card className="p-5">
        <DataTable columns={columns} data={data} getRowId={(row) => row.id} loading={isLoading} />
      </Card>
    </div>
  );
}
