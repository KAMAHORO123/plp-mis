import { translateUi, useSiteLanguage } from '../../../i18n/language';
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Trash2, Pencil, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DetailDialog } from "@/components/shared/detail-dialog";
import { generateReport } from "@/lib/actions";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatCardGrid } from "@/components/shared/stat-card-grid";
import { ChartCard } from "@/components/shared/chart-card";
import { AreaTrendChart } from "@/components/charts/area-trend-chart";
import { StatusDonutChart } from "@/components/charts/status-donut-chart";
import { DataTable, type Column } from "@/components/shared/data-table";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { Pagination } from "@/components/shared/pagination";
import { EntityCell } from "@/components/shared/entity-cell";
import { StatusBadge } from "@/components/shared/status-badge";
import { RowAction, RowActions } from "@/components/shared/row-actions";
import { type TimeRange } from "@/components/shared/time-range-tabs";
import { Dialog, DialogContent, DialogFooter, DialogTitle, } from "@/components/ui/dialog";
import { useTableState } from "@/hooks/use-table-state";
import { useSchools } from "@/hooks/use-queries";
import { useDeleteSchool, useUpdateSchool } from "@/hooks/use-mutations";
import { schoolStats, schoolStatusDonut, areaTrend } from "@/api/mock/metrics";
import { formatDate, formatNumber } from "@/lib/utils";
import type { School } from "@/types";
function buildColumns(onView: (row: School) => void, onEdit: (row: School) => void, onDelete: (row: School) => void): Column<School>[] {
    return [
        {
            id: "name",
            header: "School Name",
            cell: (row) => <EntityCell name={row.name} image={row.logo} square/>,
            sortable: true,
            sortValue: (row) => row.name,
        },
        { id: "district", header: "District", cell: (row) => row.district, sortable: true, sortValue: (row) => row.district },
        { id: "activities", header: "Activities (This Year)", cell: (row) => row.activities, sortable: true, sortValue: (row) => row.activities },
        { id: "lastActivity", header: "Last Activity Date", cell: (row) => formatDate(row.lastActivityDate) },
        {
            id: "coordinator",
            header: "Coordinator",
            cell: (row) => (<div className="leading-tight">
          <p className="text-sm font-medium text-foreground">{translateUi(row.coordinatorName)}</p>
          <p className="text-xs text-muted-foreground">{translateUi(row.coordinatorPhone)}</p>
        </div>),
        },
        { id: "status", header: "Verification status", cell: (row) => <StatusBadge status={row.status}/> },
        {
            id: "action",
            header: "Action",
            cell: (row) => (<RowActions>
          <RowAction icon={Eye} label={translateUi("View")} variant="primary" onClick={() => onView(row)}/>
          <RowAction icon={Pencil} label={translateUi("Edit")} variant="primary" onClick={() => onEdit(row)}/>
          <RowAction icon={Trash2} label={translateUi("Delete")} variant="danger" onClick={() => onDelete(row)}/>
        </RowActions>),
        },
    ];
}
export function SchoolsPage() {
    useSiteLanguage();
    const [range, setRange] = useState<TimeRange>("30d");
    const [showPendingOnly, setShowPendingOnly] = useState(false);
    const { data = [], isLoading } = useSchools(showPendingOnly ? "pending" : undefined);
    const deleteSchool = useDeleteSchool();
    const updateSchool = useUpdateSchool();
    const [toDelete, setToDelete] = useState<School | null>(null);
    const [toView, setToView] = useState<School | null>(null);
    const [toEdit, setToEdit] = useState<School | null>(null);
    const [editForm, setEditForm] = useState({
        name: "",
        district: "",
        coordinatorName: "",
        coordinatorPhone: "",
        coordinatorEmail: "",
        country: "Rwanda",
    });
    const openEdit = (row: School) => {
        setToEdit(row);
        setEditForm({
            name: row.name,
            district: row.district,
            coordinatorName: row.coordinatorName,
            coordinatorPhone: row.coordinatorPhone,
            coordinatorEmail: row.coordinatorEmail ?? "",
            country: row.country ?? "Rwanda",
        });
    };
    const columns = useMemo(() => buildColumns(setToView, openEdit, setToDelete), []);
    const table = useTableState({
        data,
        columns,
        searchFields: (row) => `${row.name} ${row.district} ${row.coordinatorName} ${row.status}`,
    });
    const handleSaveEdit = async () => {
        if (!toEdit)
            return;
        try {
            await updateSchool.mutateAsync({ id: toEdit.id, data: editForm });
            toast.success(translateUi("School updated"));
            setToEdit(null);
        }
        catch (err) {
            toast.error(translateUi(err instanceof Error ? err.message : "Update failed"));
        }
    };
    const handleDelete = async () => {
        if (!toDelete)
            return;
        try {
            await deleteSchool.mutateAsync(toDelete.id);
            toast.success(translateUi("{p0} deactivated", { p0: translateUi(toDelete.name) }));
            setToDelete(null);
        }
        catch (err) {
            toast.error(translateUi(err instanceof Error ? err.message : "Delete failed"));
        }
    };
    return (<div className="space-y-6">
      <PageHeader title={translateUi("PLP Schools Registry")} description={translateUi("Verified PLP chapters nationwide")} actions={<>
            <Button variant="secondary" onClick={() => generateReport("Schools registry report")}>
              <Download />{translateUi(" Generate a Report ")}</Button>
            <Button variant={showPendingOnly ? "primary" : "secondary"} onClick={() => setShowPendingOnly((v) => !v)}>
              {translateUi(showPendingOnly ? "Show All Schools" : "View Pending Schools")}
            </Button>
          </>}/>

      <FilterBar range={range} onRangeChange={setRange} rangeOptions={["all", "12m", "30d", "7d", "24h"]}/>
      <StatCardGrid metrics={schoolStats} loading={isLoading} columns={5}/>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title={translateUi("School Activity Trend")} description={translateUi("Verified activities submitted by PLP schools over time")} className="lg:col-span-2">
          <AreaTrendChart data={areaTrend} height={260}/>
        </ChartCard>
        <ChartCard title={translateUi("Schools Statuses")} showMenu={false}>
          <div className="flex h-[260px] items-center">
            <StatusDonutChart data={schoolStatusDonut}/>
          </div>
        </ChartCard>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-[15px] font-semibold tracking-tight">
            {translateUi(showPendingOnly ? "Pending Applications" : "All Schools")}
          </h3>
          <span className="text-sm font-medium text-primary">{translateUi(formatNumber(data.length))}</span>
        </div>
        <TableToolbar search={table.search} onSearchChange={table.setSearch} showColumns/>
        <div className="mt-4">
          <DataTable columns={columns} data={table.rows} getRowId={(row) => row.id} loading={isLoading} selectable selectedIds={table.selectedIds} onSelectChange={table.setSelectedIds} sort={table.sort} onSortChange={table.setSort}/>
        </div>
        <Pagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} className="mt-4"/>
      </Card>

      <DetailDialog open={!!toView} onOpenChange={(open) => !open && setToView(null)} title={translateUi(toView?.name ?? "School")} description={translateUi("School profile details")} fields={toView ? [
            { label: "District", value: toView.district },
            { label: "Country", value: toView.country ?? "Rwanda" },
            { label: "Coordinator", value: toView.coordinatorName },
            { label: "Phone", value: toView.coordinatorPhone },
            { label: "Email", value: toView.coordinatorEmail ?? "—" },
            { label: "Activities", value: toView.activities },
            { label: "Status", value: <StatusBadge status={toView.status}/> },
        ] : []}/>

      <Dialog open={!!toEdit} onOpenChange={(open) => !open && setToEdit(null)}>
        <DialogContent className="max-w-lg">
          <DialogTitle>{translateUi("Edit School")}</DialogTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>{translateUi("Name")}</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}/></div>
            <div><Label>{translateUi("District")}</Label><Input value={editForm.district} onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}/></div>
            <div><Label>{translateUi("Country")}</Label><Input value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}/></div>
            <div><Label>{translateUi("Coordinator")}</Label><Input value={editForm.coordinatorName} onChange={(e) => setEditForm({ ...editForm, coordinatorName: e.target.value })}/></div>
            <div><Label>{translateUi("Phone")}</Label><Input value={editForm.coordinatorPhone} onChange={(e) => setEditForm({ ...editForm, coordinatorPhone: e.target.value })}/></div>
            <div className="sm:col-span-2"><Label>{translateUi("Email")}</Label><Input value={editForm.coordinatorEmail} onChange={(e) => setEditForm({ ...editForm, coordinatorEmail: e.target.value })}/></div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setToEdit(null)}>{translateUi("Cancel")}</Button>
            <Button onClick={handleSaveEdit} loading={updateSchool.isPending}>{translateUi("Save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)} title={translateUi("Deactivate school?")} description={translateUi("This will mark {p0} as inactive.", { p0: translateUi(toDelete?.name ?? "this school") })} confirmLabel="Deactivate" destructive loading={deleteSchool.isPending} onConfirm={handleDelete}/>
    </div>);
}
