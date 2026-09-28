import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { useMeetings } from "@/hooks/use-queries";
import { useCreateMeeting } from "@/hooks/use-mutations";
import { useAuth } from "@/features/authentication/auth-context";
import { formatDate } from "@/lib/utils";

type MeetingRow = {
  id: string;
  title: string;
  scheduledAt: string;
  location?: string;
};

const columns: Column<MeetingRow>[] = [
  { id: "title", header: "Title", cell: (row) => row.title },
  { id: "date", header: "Date", cell: (row) => formatDate(row.scheduledAt) },
  { id: "location", header: "Location", cell: (row) => row.location ?? "—" },
];

export function CoordinatorMeetingsPage() {
  const { user } = useAuth();
  const { data = [], isLoading } = useMeetings();
  const createMeeting = useCreateMeeting();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", location: "", description: "" });

  const rows: MeetingRow[] = (data as Record<string, unknown>[]).map((m) => ({
    id: String(m.id),
    title: String(m.title),
    scheduledAt: String(m.scheduledAt),
    location: m.location ? String(m.location) : undefined,
  }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMeeting.mutateAsync({
        ...form,
        scheduledAt: new Date().toISOString(),
        schoolId: user?.schoolId,
      });
      toast.success("Meeting scheduled");
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to schedule meeting");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meetings"
        description="Schedule meetings and upload minutes."
        actions={
          <Button onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-4 w-4" />
            Schedule Meeting
          </Button>
        }
      />
      {showForm && (
        <Card className="p-5">
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Button type="submit" loading={createMeeting.isPending}>Save</Button></div>
          </form>
        </Card>
      )}
      <Card className="p-5">
        <DataTable columns={columns} data={rows} getRowId={(row) => row.id} loading={isLoading} />
      </Card>
    </div>
  );
}
