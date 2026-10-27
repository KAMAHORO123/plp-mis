import { translateUi, useSiteLanguage } from '../../../i18n/language';
import { useState } from "react";
import { UploadCloud, BookOpen, FileText, Trash2, Archive, Pencil, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { StatCardGrid } from "@/components/shared/stat-card-grid";
import { DataTable, type Column } from "@/components/shared/data-table";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { RowAction, RowActions } from "@/components/shared/row-actions";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Dialog, DialogContent, DialogFooter, DialogTitle, } from "@/components/ui/dialog";
import { useTableState } from "@/hooks/use-table-state";
import { useProgramModules, useResources } from "@/hooks/use-queries";
import { useArchiveResource, useUpdateResource, useUploadResource } from "@/hooks/use-mutations";
import { programStats } from "@/api/mock/metrics";
import { cn, formatDate, formatNumber } from "@/lib/utils";
import type { Resource } from "@/types";
export function ProgramPage() {
    useSiteLanguage();
    const { data: modules = [] } = useProgramModules();
    const [activeModule, setActiveModule] = useState<string | undefined>();
    const selectedModule = activeModule ?? modules[0]?.id;
    const { data = [], isLoading } = useResources();
    const uploadResource = useUploadResource();
    const updateResource = useUpdateResource();
    const archiveResource = useArchiveResource();
    const [showUpload, setShowUpload] = useState(false);
    const [toEdit, setToEdit] = useState<Resource | null>(null);
    const [toArchive, setToArchive] = useState<Resource | null>(null);
    const [uploadForm, setUploadForm] = useState({
        fileName: "",
        fileSize: "0 KB",
        description: "",
        category: "CURRICULUM",
        moduleId: "",
    });
    const [editForm, setEditForm] = useState({ fileName: "", description: "" });
    const columns: Column<Resource>[] = [
        {
            id: "file",
            header: "File",
            cell: (row) => (<div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <FileText className="h-4 w-4"/>
          </span>
          <div className="leading-tight">
            <p className="text-sm font-medium text-foreground">{translateUi(row.fileName)}</p>
            <p className="text-xs text-muted-foreground">{translateUi(row.fileSize)}</p>
          </div>
        </div>),
            sortable: true,
            sortValue: (row) => row.fileName,
        },
        {
            id: "description",
            header: "Description",
            cell: (row) => <p className="max-w-[240px] truncate text-muted-foreground">{translateUi(row.description)}</p>,
            className: "max-w-[240px]",
        },
        { id: "module", header: "Module", cell: (row) => row.module },
        { id: "category", header: "Category", cell: (row) => row.category ?? "—" },
        { id: "availability", header: "Availability", cell: (row) => <StatusBadge status={row.availability}/> },
        { id: "lastUpdate", header: "Last Update", cell: (row) => formatDate(row.lastUpdate), sortable: true, sortValue: (row) => row.lastUpdate },
        {
            id: "action",
            header: "Action",
            cell: (row) => (<RowActions>
          <RowAction icon={Pencil} label={translateUi("Edit")} variant="primary" onClick={() => { setToEdit(row); setEditForm({ fileName: row.fileName, description: row.description }); }}/>
          <RowAction icon={Archive} label={translateUi("Archive")} onClick={() => setToArchive(row)}/>
          <RowAction icon={Trash2} label={translateUi("Delete")} variant="danger" onClick={() => setToArchive(row)}/>
          <RowAction icon={Download} label={translateUi("Download")} variant="primary" onClick={() => toast.success(translateUi("Downloading {p0}", { p0: translateUi(row.fileName) }))}/>
        </RowActions>),
        },
    ];
    const table = useTableState({
        data,
        columns,
        searchFields: (row) => `${row.fileName} ${row.module} ${row.description}`,
    });
    const handleUpload = async () => {
        try {
            await uploadResource.mutateAsync({
                ...uploadForm,
                moduleId: uploadForm.moduleId || selectedModule,
            });
            toast.success(translateUi("Resource uploaded"));
            setShowUpload(false);
            setUploadForm({ fileName: "", fileSize: "0 KB", description: "", category: "CURRICULUM", moduleId: "" });
        }
        catch (err) {
            toast.error(translateUi(err instanceof Error ? err.message : "Upload failed"));
        }
    };
    const handleEdit = async () => {
        if (!toEdit)
            return;
        try {
            await updateResource.mutateAsync({ id: toEdit.id, data: editForm });
            toast.success(translateUi("Resource updated"));
            setToEdit(null);
        }
        catch (err) {
            toast.error(translateUi(err instanceof Error ? err.message : "Update failed"));
        }
    };
    const handleArchive = async () => {
        if (!toArchive)
            return;
        try {
            await archiveResource.mutateAsync(toArchive.id);
            toast.success(translateUi("Resource archived"));
            setToArchive(null);
        }
        catch (err) {
            toast.error(translateUi(err instanceof Error ? err.message : "Archive failed"));
        }
    };
    return (<div className="space-y-6">
      <PageHeader title={translateUi("PLP Curriculum & Knowledge Vault")} description={translateUi("Centralized management of national curriculum, learning resources, and program standards.")} actions={<Button onClick={() => setShowUpload(true)}>
            <UploadCloud />{translateUi(" Upload New Resource ")}</Button>}/>

      <StatCardGrid metrics={programStats} loading={isLoading} columns={4}/>

      <div>
        <h2 className="text-[15px] font-semibold tracking-tight">{translateUi("Curriculum Modules")}</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {translateUi(modules.map((module) => {
            const selected = module.id === selectedModule;
            return (<button key={module.id} onClick={() => setActiveModule(module.id)} className={cn("flex items-center gap-3 rounded-xl border p-4 text-left transition-all", selected ? "border-primary/30 bg-card ring-1 ring-primary/20" : "border-border bg-card hover:border-primary/20")}>
                <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                  <BookOpen className="h-4 w-4"/>
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-medium text-foreground">{translateUi(module.title)}</p>
                  <p className="text-xs text-muted-foreground">{translateUi("Last Updated on ")}{translateUi(module.lastUpdated)}</p>
                </div>
              </button>);
        }))}
        </div>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-[15px] font-semibold tracking-tight">{translateUi("Resources")}</h3>
          <span className="text-sm font-medium text-primary">{translateUi(formatNumber(data.length))}</span>
        </div>
        <TableToolbar search={table.search} onSearchChange={table.setSearch} showColumns/>
        <div className="mt-4">
          <DataTable columns={columns} data={table.rows} getRowId={(row) => row.id} loading={isLoading} sort={table.sort} onSortChange={table.setSort}/>
        </div>
        <Pagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} className="mt-4"/>
      </Card>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogTitle>{translateUi("Upload Resource")}</DialogTitle>
          <div className="mt-4 space-y-3">
            <div><Label>{translateUi("File Name")}</Label><Input value={uploadForm.fileName} onChange={(e) => setUploadForm({ ...uploadForm, fileName: e.target.value })}/></div>
            <div><Label>{translateUi("File Size")}</Label><Input value={uploadForm.fileSize} onChange={(e) => setUploadForm({ ...uploadForm, fileSize: e.target.value })}/></div>
            <div><Label>{translateUi("Description")}</Label><Input value={uploadForm.description} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}/></div>
            <div>
              <Label>{translateUi("Category")}</Label>
              <select className="flex h-10 w-full rounded-md border px-3 text-sm" value={uploadForm.category} onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}>
                <option value="CURRICULUM">{translateUi("Curriculum")}</option>
                <option value="LEADERSHIP_MANUAL">{translateUi("Leadership Manual")}</option>
                <option value="POLICY">{translateUi("Policy")}</option>
                <option value="TRAINING_MATERIAL">{translateUi("Training Material")}</option>
              </select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setShowUpload(false)}>{translateUi("Cancel")}</Button>
            <Button onClick={handleUpload} loading={uploadResource.isPending}>{translateUi("Upload")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!toEdit} onOpenChange={(open) => !open && setToEdit(null)}>
        <DialogContent>
          <DialogTitle>{translateUi("Edit Resource")}</DialogTitle>
          <div className="mt-4 space-y-3">
            <div><Label>{translateUi("File Name")}</Label><Input value={editForm.fileName} onChange={(e) => setEditForm({ ...editForm, fileName: e.target.value })}/></div>
            <div><Label>{translateUi("Description")}</Label><Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}/></div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setToEdit(null)}>{translateUi("Cancel")}</Button>
            <Button onClick={handleEdit} loading={updateResource.isPending}>{translateUi("Save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!toArchive} onOpenChange={(open) => !open && setToArchive(null)} title={translateUi("Archive resource?")} description={translateUi("Archive {p0}?", { p0: translateUi(toArchive?.fileName ?? "this resource") })} confirmLabel="Archive" loading={archiveResource.isPending} onConfirm={handleArchive}/>
    </div>);
}
