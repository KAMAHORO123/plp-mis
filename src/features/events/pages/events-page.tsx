import { useMemo, useState } from "react";
import { Download, Plus, Trash2, Maximize2, Check, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateReport } from "@/lib/actions";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatCardGrid } from "@/components/shared/stat-card-grid";
import { ChartCard } from "@/components/shared/chart-card";
import { BarActivityChart } from "@/components/charts/bar-activity-chart";
import { DataTable, type Column } from "@/components/shared/data-table";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { AttachmentsCell } from "@/components/shared/attachments-cell";
import { RowAction, RowActions } from "@/components/shared/row-actions";
import { DetailDialog } from "@/components/shared/detail-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { type TimeRange } from "@/components/shared/time-range-tabs";
import { useTableState } from "@/hooks/use-table-state";
import { useEvents } from "@/hooks/use-queries";
import { useCreateEvent, useDeleteEvent, usePublishEvent } from "@/hooks/use-mutations";
import { eventStats, barTrend } from "@/api/mock/metrics";
import { cn, formatDate } from "@/lib/utils";
import type { PlpEvent } from "@/types";

const TABS = [
  { id: "upcoming", label: "Upcoming Events" },
  { id: "requests", label: "Event Requests" },
  { id: "reports", label: "Pending Event Reports" },
  { id: "archive", label: "Events Archive" },
];

export function EventsPage() {
  const [range, setRange] = useState<TimeRange>("12m");
  const [tab, setTab] = useState("upcoming");
  const { data = [], isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const publishEvent = usePublishEvent();
  const [showCreate, setShowCreate] = useState(false);
  const [toView, setToView] = useState<PlpEvent | null>(null);
  const [toDelete, setToDelete] = useState<PlpEvent | null>(null);
  const [form, setForm] = useState({ name: "", description: "", host: "PLP National", location: "", category: "" });

  const filtered = useMemo(() => {
    switch (tab) {
      case "requests":
        return data.filter((e) => e.status === "pending");
      case "reports":
        return data.filter((e) => e.status === "ongoing");
      case "archive":
        return data.filter((e) => ["approved", "published", "cancelled"].includes(e.status));
      default:
        return data.filter((e) => ["upcoming", "published", "ongoing"].includes(e.status));
    }
  }, [data, tab]);

  const makeActions = (row: PlpEvent, options?: { approve?: boolean }) => (
    <RowActions>
      <RowAction icon={Eye} label="View" onClick={() => setToView(row)} />
      {options?.approve && (
        <>
          <RowAction icon={Check} label="Approve" variant="success" onClick={async () => { await publishEvent.mutateAsync(row.id); toast.success("Event approved"); }} />
          <RowAction icon={X} label="Reject" variant="danger" onClick={async () => { await deleteEvent.mutateAsync(row.id); toast.success("Event rejected"); }} />
        </>
      )}
      <RowAction icon={Trash2} label="Delete" variant="danger" onClick={() => setToDelete(row)} />
      <RowAction icon={Maximize2} label="Publish" variant="primary" onClick={async () => { await publishEvent.mutateAsync(row.id); toast.success("Event published"); }} />
    </RowActions>
  );

  const columns: Column<PlpEvent>[] = useMemo(() => {
    if (tab === "requests") {
      return [
        { id: "event", header: "Event", cell: (row) => row.title, sortable: true, sortValue: (row) => row.title },
        { id: "category", header: "Category", cell: (row) => row.category },
        { id: "school", header: "School", cell: (row) => row.school },
        { id: "district", header: "District", cell: (row) => row.district },
        { id: "participants", header: "Participants", cell: (row) => row.participants },
        { id: "action", header: "Action", cell: (row) => makeActions(row, { approve: true }) },
      ];
    }
    if (tab === "reports") {
      return [
        { id: "event", header: "Event", cell: (row) => row.title },
        { id: "school", header: "School", cell: (row) => row.school },
        { id: "participants", header: "Participants", cell: (row) => row.participants },
        { id: "eventDate", header: "Event Date", cell: (row) => formatDate(row.date) },
        { id: "attachments", header: "Attachments", cell: () => <AttachmentsCell count={1} /> },
        { id: "action", header: "Action", cell: (row) => makeActions(row) },
      ];
    }
    if (tab === "archive") {
      return [
        { id: "event", header: "Event", cell: (row) => row.title },
        { id: "description", header: "Description", cell: (row) => row.description },
        { id: "host", header: "Host", cell: (row) => row.host },
        { id: "category", header: "Category", cell: (row) => row.category },
        { id: "eventDate", header: "Event Date", cell: (row) => formatDate(row.date) },
        { id: "action", header: "Action", cell: (row) => makeActions(row) },
      ];
    }
    return [
      { id: "event", header: "Event", cell: (row) => row.title, sortable: true, sortValue: (row) => row.title },
      { id: "description", header: "Description", cell: (row) => row.description },
      { id: "type", header: "Type", cell: (row) => row.type },
      { id: "host", header: "Host", cell: (row) => row.host },
      { id: "availability", header: "Availability", cell: (row) => <StatusBadge status={row.availability} /> },
      { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
      { id: "date", header: "Date & Time", cell: (row) => `${formatDate(row.date)} · ${row.time}` },
      { id: "action", header: "Action", cell: (row) => makeActions(row) },
    ];
  }, [tab, publishEvent, deleteEvent]);

  const table = useTableState({
    data: filtered,
    columns,
    searchFields: (row) => `${row.title} ${row.host} ${row.school} ${row.district} ${row.type}`,
  });

  const handleCreate = async () => {
    try {
      await createEvent.mutateAsync({
        ...form,
        level: "NATIONAL",
        startsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
        isPublished: true,
      });
      toast.success("Event created");
      setShowCreate(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create event");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="National Events & Community Visibility"
        description="Manage, monitor, and track all national and school-level PLP events."
        actions={
          <>
            <Button variant="secondary" onClick={() => generateReport("Events report")}>
              <Download />
              Generate Events Report
            </Button>
            <Button onClick={() => setShowCreate(true)}>
              <Plus />
              Create a New Event
            </Button>
          </>
        }
      />

      <FilterBar range={range} onRangeChange={setRange} rangeOptions={["all", "12m", "30d", "7d", "24h"]} />
      <StatCardGrid metrics={eventStats} loading={isLoading} columns={5} />
      <ChartCard title="Event Activity Trend" description="National event activity across schools.">
        <BarActivityChart data={barTrend} />
      </ChartCard>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center gap-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors", tab === t.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {t.label}
            </button>
          ))}
        </div>
        <TableToolbar search={table.search} onSearchChange={table.setSearch} showColumns className="mt-3" />
        <div className="mt-4">
          <DataTable columns={columns} data={table.rows} getRowId={(row) => row.id} loading={isLoading} sort={table.sort} onSortChange={table.setSort} />
        </div>
        <Pagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} className="mt-4" />
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogTitle>Create National Event</DialogTitle>
          <div className="mt-4 space-y-3">
            <div><Label>Event Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={createEvent.isPending}>Create & Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DetailDialog
        open={!!toView}
        onOpenChange={(open) => !open && setToView(null)}
        title={toView?.title ?? "Event"}
        fields={toView ? [
          { label: "Host", value: toView.host },
          { label: "School", value: toView.school },
          { label: "Location", value: toView.location ?? "—" },
          { label: "Date", value: formatDate(toView.date) },
          { label: "Status", value: <StatusBadge status={toView.status} /> },
          { label: "Description", value: toView.description },
        ] : []}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Cancel event?"
        description={`Cancel ${toDelete?.title ?? "this event"}?`}
        confirmLabel="Cancel Event"
        destructive
        loading={deleteEvent.isPending}
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteEvent.mutateAsync(toDelete.id);
          toast.success("Event cancelled");
          setToDelete(null);
        }}
      />
    </div>
  );
}
