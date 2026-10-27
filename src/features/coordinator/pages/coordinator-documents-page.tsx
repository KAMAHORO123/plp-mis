import { translateUi, useSiteLanguage } from '../../../i18n/language';
import { Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { RowAction, RowActions } from "@/components/shared/row-actions";
import { useResources } from "@/hooks/use-queries";
import { useDownloadResource } from "@/hooks/use-mutations";
import type { Resource } from "@/types";
export function CoordinatorDocumentsPage() {
    useSiteLanguage();
    const { data = [], isLoading } = useResources();
    const downloadResource = useDownloadResource();
    const columns: Column<Resource>[] = [
        { id: "file", header: "File", cell: (row) => row.fileName },
        { id: "category", header: "Category", cell: (row) => row.category ?? "—" },
        { id: "module", header: "Module", cell: (row) => row.module },
        { id: "size", header: "Size", cell: (row) => row.fileSize },
        { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.availability}/> },
        {
            id: "actions",
            header: "Actions",
            cell: (row) => (<RowActions>
          <RowAction icon={Download} label={translateUi("Download material")} variant="primary" onClick={async () => {
                    await downloadResource.mutateAsync({ id: row.id, fileName: row.fileName });
                    toast.success(translateUi("Download started"));
                }}/>
        </RowActions>),
        },
    ];
    return (<div className="space-y-6">
      <PageHeader title={translateUi("Documents")} description={translateUi("Download curriculum, policies, and learning materials uploaded by PLP National.")}/>
      <Card className="p-5">
        <DataTable columns={columns} data={data} getRowId={(row) => row.id} loading={isLoading}/>
      </Card>
    </div>);
}
