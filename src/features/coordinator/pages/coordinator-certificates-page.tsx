import { translateUi, useSiteLanguage } from '../../../i18n/language';
import { useMemo, useState } from "react";
import { Download, FileCheck2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { RowAction, RowActions } from "@/components/shared/row-actions";
import { useCertificates, useCertifications, useMembers } from "@/hooks/use-queries";
import { useDownloadAllCertificates, useDownloadCertificate, useRequestCertification, } from "@/hooks/use-mutations";
import { useAuth } from "@/features/authentication/auth-context";
import { formatDate } from "@/lib/utils";
type CertRow = {
    id: string;
    number: string;
    activityName: string;
    issueDate: string;
    status: string;
    memberName: string;
};
export function CoordinatorCertificatesPage() {
    useSiteLanguage();
    const { user } = useAuth();
    const { data = [], isLoading } = useCertificates();
    const { data: requests = [] } = useCertifications();
    const { data: members = [] } = useMembers();
    const requestCertification = useRequestCertification();
    const downloadCertificate = useDownloadCertificate();
    const downloadAll = useDownloadAllCertificates();
    const [showForm, setShowForm] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [activityName, setActivityName] = useState("PLP Leadership Program");
    const graduatedMembers = useMemo(() => members.filter((m) => m.status === "graduated" || m.role === "Graduate"), [members]);
    const rows: CertRow[] = (data as Record<string, unknown>[]).map((c) => {
        const member = c.member as {
            name?: string;
        } | undefined;
        return {
            id: String(c.id),
            number: String(c.number),
            activityName: String(c.activityName),
            issueDate: String(c.issueDate),
            status: String(c.status).toLowerCase(),
            memberName: member?.name ?? "—",
        };
    });
    const columns: Column<CertRow>[] = [
        { id: "number", header: "Certificate #", cell: (row) => row.number },
        { id: "member", header: "Member", cell: (row) => row.memberName },
        { id: "activity", header: "Program", cell: (row) => row.activityName },
        { id: "date", header: "Issue Date", cell: (row) => formatDate(row.issueDate) },
        { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status as "issued"}/> },
        {
            id: "actions",
            header: "Actions",
            cell: (row) => (<RowActions>
          <RowAction icon={Download} label={translateUi("Download certificate")} variant="primary" onClick={async () => {
                    await downloadCertificate.mutateAsync({ id: row.id, number: row.number });
                    toast.success(translateUi("Certificate download started"));
                }}/>
        </RowActions>),
        },
    ];
    const requestRows = requests.map((request) => ({
        id: request.id,
        schoolName: request.schoolName,
        certificateCount: request.certificateCount,
        requestDate: request.requestDate,
        status: request.status,
    }));
    const requestColumns: Column<(typeof requestRows)[number]>[] = [
        { id: "count", header: "Certificates", cell: (row) => row.certificateCount },
        { id: "date", header: "Requested", cell: (row) => formatDate(row.requestDate) },
        { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status}/> },
    ];
    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await requestCertification.mutateAsync({
                memberIds: selectedIds,
                activityName,
                schoolId: user?.schoolId,
            });
            toast.success(translateUi("Certificate request sent to PLP National"));
            setShowForm(false);
            setSelectedIds([]);
        }
        catch (err) {
            toast.error(translateUi(err instanceof Error ? err.message : "Failed to request certificates"));
        }
    };
    return (<div className="space-y-6">
      <PageHeader title={translateUi("Certificates")} description={translateUi("Request certificates for graduated members and download approved certificates.")} actions={<>
            <Button variant="secondary" onClick={() => downloadAll.mutate()}>
              <Download />{translateUi(" Download All ")}</Button>
            <Button onClick={() => setShowForm((s) => !s)}>
              <Plus className="h-4 w-4"/>{translateUi(" Request Certificates ")}</Button>
          </>}/>

      {translateUi(showForm && (<Card className="p-5">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>{translateUi("Certificate program / activity")}</Label>
              <Input value={activityName} onChange={(e) => setActivityName(e.target.value)} required/>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>{translateUi("Graduated members")}</Label>
                <span className="text-sm text-muted-foreground">{translateUi(selectedIds.length)}{translateUi(" selected")}</span>
              </div>
              <DataTable columns={[
                { id: "name", header: "Name", cell: (row) => row.name },
                { id: "memberId", header: "Member ID", cell: (row) => row.memberId },
                { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status}/> },
            ]} data={graduatedMembers} getRowId={(row) => row.id} selectable selectedIds={selectedIds} onSelectChange={setSelectedIds} emptyTitle="No graduated members" emptyDescription="Mark members as graduated before requesting certificates."/>
            </div>
            <Button type="submit" loading={requestCertification.isPending} disabled={!selectedIds.length}>
              <FileCheck2 />{translateUi(" Send Request ")}</Button>
          </form>
        </Card>))}

      <Card className="p-5">
        <h3 className="mb-4 text-[15px] font-semibold">{translateUi("Certificate Requests")}</h3>
        <DataTable columns={requestColumns} data={requestRows} getRowId={(row) => row.id}/>
      </Card>

      <Card className="p-5">
        <h3 className="mb-4 text-[15px] font-semibold">{translateUi("Issued Certificates")}</h3>
        <DataTable columns={columns} data={rows} getRowId={(row) => row.id} loading={isLoading}/>
      </Card>
    </div>);
}
