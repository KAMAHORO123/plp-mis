import { useState } from "react";
import { CheckCircle2, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { RowAction, RowActions } from "@/components/shared/row-actions";
import { useEvents } from "@/hooks/use-queries";
import { useConfirmEventAttendance, useCreateEvent, usePublishEvent } from "@/hooks/use-mutations";
import { useAuth } from "@/features/authentication/auth-context";
import type { PlpEvent } from "@/types";

export function CoordinatorEventsPage() {
  const { user } = useAuth();
  const { data = [], isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const publishEvent = usePublishEvent();
  const confirmAttendance = useConfirmEventAttendance();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    host: user?.name ?? "",
    location: "",
    category: "",
  });

  const columns: Column<PlpEvent>[] = [
    { id: "title", header: "Event", cell: (row) => row.title },
    { id: "date", header: "Date", cell: (row) => row.date },
    { id: "location", header: "Location", cell: (row) => row.location ?? "—" },
    { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    { id: "attendance", header: "Attendance", cell: (row) => row.attendanceConfirmed ? "Confirmed" : "Not confirmed" },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <RowActions>
          <RowAction
            icon={Upload}
            label="Publish"
            onClick={async () => {
              await publishEvent.mutateAsync(row.id);
              toast.success("Event published");
            }}
          />
          <RowAction
            icon={CheckCircle2}
            label="Confirm attendance"
            variant="success"
            onClick={async () => {
              await confirmAttendance.mutateAsync(row.id);
              toast.success("Attendance confirmed");
            }}
          />
        </RowActions>
      ),
    },
  ];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEvent.mutateAsync({
        ...form,
        level: "SCHOOL",
        startsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        schoolId: user?.schoolId,
      });
      toast.success("Event created");
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create event");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Create and publish school events."
        actions={
          <Button onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        }
      />
      {showForm && (
        <Card className="p-5">
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div><Label>Event Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
            <div><Button type="submit" loading={createEvent.isPending}>Create</Button></div>
          </form>
        </Card>
      )}
      <Card className="p-5">
        <DataTable columns={columns} data={data} getRowId={(row) => row.id} loading={isLoading} />
      </Card>
    </div>
  );
}
