import { translateUi, useSiteLanguage } from '../../../i18n/language';
import { useMemo, useState } from "react";
import { Download, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateReport } from "@/lib/actions";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatCardGrid } from "@/components/shared/stat-card-grid";
import { DataTable, type Column } from "@/components/shared/data-table";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { Pagination } from "@/components/shared/pagination";
import { EntityCell } from "@/components/shared/entity-cell";
import { StatusBadge } from "@/components/shared/status-badge";
import { RowAction, RowActions } from "@/components/shared/row-actions";
import { DetailDialog } from "@/components/shared/detail-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Dialog, DialogContent, DialogFooter, DialogTitle, } from "@/components/ui/dialog";
import { type TimeRange } from "@/components/shared/time-range-tabs";
import { MemberSubNav, type MemberTab } from "@/features/members/components/member-sub-nav";
import { AddFacilitatorModal } from "@/features/members/components/add-facilitator-modal";
import { useTableState } from "@/hooks/use-table-state";
import { useMembers } from "@/hooks/use-queries";
import { useDeleteMember, useUpdateMember } from "@/hooks/use-mutations";
import { memberStats } from "@/api/mock/metrics";
import { formatDate, formatNumber } from "@/lib/utils";
import type { Member, MemberRole } from "@/types";
const TAB_ROLE: Partial<Record<MemberTab, MemberRole>> = {
    students: "Student",
    coordinators: "Coordinator",
    facilitators: "Facilitator",
    graduates: "Graduate",
};
export function MembersPage() {
    useSiteLanguage();
    const [range, setRange] = useState<TimeRange>("30d");
    const [tab, setTab] = useState<MemberTab>("overview");
    const [showPendingOnly, setShowPendingOnly] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const { data = [], isLoading } = useMembers(undefined, showPendingOnly ? "pending" : undefined);
    const updateMember = useUpdateMember();
    const deleteMember = useDeleteMember();
    const [toView, setToView] = useState<Member | null>(null);
    const [toEdit, setToEdit] = useState<Member | null>(null);
    const [toDelete, setToDelete] = useState<Member | null>(null);
    const [editForm, setEditForm] = useState({ name: "", affiliation: "", district: "", status: "active" as Member["status"], role: "Student" as Member["role"], graduationYear: "" });
    const filtered = useMemo(() => {
        const role = TAB_ROLE[tab];
        return role ? data.filter((m) => m.role === role) : data;
    }, [data, tab]);
    const openEdit = (row: Member) => {
        setToEdit(row);
        setEditForm({
            name: row.name,
            affiliation: row.affiliation,
            district: row.district,
            status: row.status,
            role: row.role,
            graduationYear: row.graduationYear,
        });
    };
    const actionCol: Column<Member> = {
        id: "action",
        header: "Action",
        cell: (row) => (<RowActions>
        <RowAction icon={Eye} label={translateUi("View")} onClick={() => setToView(row)}/>
        <RowAction icon={Pencil} label={translateUi("Edit")} variant="primary" onClick={() => openEdit(row)}/>
        <RowAction icon={Trash2} label={translateUi("Delete")} variant="danger" onClick={() => setToDelete(row)}/>
      </RowActions>),
    };
    const memberCol: Column<Member> = {
        id: "member",
        header: "Member",
        cell: (row) => <EntityCell name={row.name} subtitle={row.memberId} image={row.avatar}/>,
        sortable: true,
        sortValue: (row) => row.name,
    };
    const statusCol: Column<Member> = {
        id: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status}/>,
    };
    const columns = tab === "overview"
        ? [
            memberCol,
            { id: "role", header: "Role", cell: (row: Member) => row.role },
            { id: "affiliation", header: "Affiliation", cell: (row: Member) => row.affiliation },
            { id: "lastActivity", header: "Last Activity Date", cell: (row: Member) => formatDate(row.lastActivityDate) },
            { id: "district", header: "District", cell: (row: Member) => row.district },
            statusCol,
            actionCol,
        ]
        : [
            memberCol,
            { id: "affiliation", header: "Affiliation", cell: (row: Member) => row.affiliation },
            { id: "district", header: "District", cell: (row: Member) => row.district },
            { id: "joined", header: "Joined Date", cell: (row: Member) => formatDate(row.joinedDate), sortable: true, sortValue: (row: Member) => row.joinedDate },
            { id: "graduation", header: "Graduation Year", cell: (row: Member) => row.graduationYear },
            statusCol,
            actionCol,
        ];
    const table = useTableState({
        data: filtered,
        columns,
        searchFields: (row) => `${row.name} ${row.memberId} ${row.role} ${row.affiliation} ${row.district} ${row.status}`,
    });
    const handleSave = async () => {
        if (!toEdit)
            return;
        try {
            await updateMember.mutateAsync({
                id: toEdit.id,
                data: {
                    name: editForm.name,
                    affiliation: editForm.affiliation,
                    district: editForm.district,
                    role: editForm.role,
                    status: editForm.status,
                    graduationYear: editForm.graduationYear,
                },
            });
            toast.success(translateUi("Member updated"));
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
            await deleteMember.mutateAsync(toDelete.id);
            toast.success(translateUi("Member deactivated"));
            setToDelete(null);
        }
        catch (err) {
            toast.error(translateUi(err instanceof Error ? err.message : "Delete failed"));
        }
    };
    return (<div className="space-y-6">
      <PageHeader title={translateUi("PLP Members Registry")} description={translateUi("Verified PLP members nationwide")} actions={<>
            <Button variant="secondary" onClick={() => generateReport("Members registry report")}>
              <Download />{translateUi(" Generate a Report ")}</Button>
            <Button variant={showPendingOnly ? "primary" : "secondary"} onClick={() => setShowPendingOnly((v) => !v)}>
              {translateUi(showPendingOnly ? "Show All Members" : "View Pending Members")}
            </Button>
          </>}/>

      <FilterBar range={range} onRangeChange={setRange} rangeOptions={["all", "12m", "30d", "7d", "24h"]}/>

      <div className="flex flex-col gap-6 lg:flex-row">
        <MemberSubNav active={tab} onChange={setTab}/>
        <div className="min-w-0 flex-1 space-y-6">
          <StatCardGrid metrics={memberStats[tab] ?? memberStats.overview} loading={isLoading} columns={4}/>
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <h3 className="text-[15px] font-semibold tracking-tight">
                {translateUi(tab === "overview" ? "All Members" : memberStats[tab][0].label)}
              </h3>
              <span className="text-sm font-medium text-primary">{translateUi(formatNumber(filtered.length))}</span>
            </div>
            <TableToolbar search={table.search} onSearchChange={table.setSearch} showColumns/>
            {translateUi(tab === "facilitators" && (<div className="mt-3 flex justify-end">
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  <Plus />{translateUi(" Add Facilitator ")}</Button>
              </div>))}
            <div className="mt-4">
              <DataTable columns={columns} data={table.rows} getRowId={(row) => row.id} loading={isLoading} selectable selectedIds={table.selectedIds} onSelectChange={table.setSelectedIds} sort={table.sort} onSortChange={table.setSort}/>
            </div>
            <Pagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} className="mt-4"/>
          </Card>
        </div>
      </div>

      <DetailDialog open={!!toView} onOpenChange={(open) => !open && setToView(null)} title={translateUi(toView?.name ?? "Member")} fields={toView ? [
            { label: "Member ID", value: toView.memberId },
            { label: "Role", value: toView.role },
            { label: "Affiliation", value: toView.affiliation },
            { label: "District", value: toView.district },
            { label: "Joined", value: formatDate(toView.joinedDate) },
            { label: "Status", value: <StatusBadge status={toView.status}/> },
        ] : []}/>

      <Dialog open={!!toEdit} onOpenChange={(open) => !open && setToEdit(null)}>
        <DialogContent>
          <DialogTitle>{translateUi("Edit Member")}</DialogTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>{translateUi("Name")}</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}/></div>
            <div><Label>{translateUi("Affiliation")}</Label><Input value={editForm.affiliation} onChange={(e) => setEditForm({ ...editForm, affiliation: e.target.value })}/></div>
            <div><Label>{translateUi("District")}</Label><Input value={editForm.district} onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}/></div>
            <div>
              <Label>{translateUi("Role")}</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as Member["role"] })}>
                <option value="Student">Student</option>
                <option value="Graduate">Graduate</option>
                <option value="Coordinator">Coordinator</option>
                <option value="Facilitator">Facilitator</option>
              </select>
            </div>
            <div>
              <Label>{translateUi("Status")}</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Member["status"] })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="graduated">Graduated</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label>{translateUi("Graduation year")}</Label>
              <Input value={editForm.graduationYear} onChange={(e) => setEditForm({ ...editForm, graduationYear: e.target.value })} placeholder={translateUi("e.g. 2026")}/>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setToEdit(null)}>{translateUi("Cancel")}</Button>
            <Button onClick={handleSave} loading={updateMember.isPending}>{translateUi("Save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)} title={translateUi("Deactivate member?")} description={translateUi("Mark {p0} as inactive?", { p0: translateUi(toDelete?.name ?? "this member") })} confirmLabel="Deactivate" destructive loading={deleteMember.isPending} onConfirm={handleDelete}/>

      <AddFacilitatorModal open={addOpen} onOpenChange={setAddOpen}/>
    </div>);
}
