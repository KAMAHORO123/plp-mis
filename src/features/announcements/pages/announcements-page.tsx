import { translateUi, useSiteLanguage } from '../../../i18n/language';
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
import { useAnnouncements } from "@/hooks/use-queries";
import { useCreateAnnouncement } from "@/hooks/use-mutations";
import { formatDate } from "@/lib/utils";
type AnnouncementRow = {
    id: string;
    title: string;
    content: string;
    status: string;
    publishedAt: string;
};
const columns: Column<AnnouncementRow>[] = [
    { id: "title", header: "Title", cell: (row) => row.title },
    { id: "date", header: "Published", cell: (row) => formatDate(row.publishedAt) },
    { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status as "published"}/> },
];
export function AnnouncementsPage() {
    useSiteLanguage();
    const { data = [], isLoading } = useAnnouncements();
    const createAnnouncement = useCreateAnnouncement();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: "", content: "" });
    const rows: AnnouncementRow[] = (data as Record<string, unknown>[]).map((a) => ({
        id: String(a.id),
        title: String(a.title),
        content: String(a.content),
        status: String(a.status).toLowerCase(),
        publishedAt: String(a.publishedAt),
    }));
    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createAnnouncement.mutateAsync(form);
            toast.success(translateUi("Announcement published"));
            setShowForm(false);
            setForm({ title: "", content: "" });
        }
        catch (err) {
            toast.error(translateUi(err instanceof Error ? err.message : "Failed to publish"));
        }
    };
    return (<div className="space-y-6">
      <PageHeader title={translateUi("National Announcements")} description={translateUi("Publish announcements to coordinator dashboards and the public website.")} actions={<Button onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-4 w-4"/>{translateUi(" Publish Announcement ")}</Button>}/>
      {translateUi(showForm && (<Card className="p-5">
          <form onSubmit={onSubmit} className="grid gap-4">
            <div><Label>{translateUi("Title")}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required/></div>
            <div><Label>{translateUi("Content")}</Label><Input value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required/></div>
            <Button type="submit" loading={createAnnouncement.isPending}>{translateUi("Publish")}</Button>
          </form>
        </Card>))}
      <Card className="p-5">
        <DataTable columns={columns} data={rows} getRowId={(row) => row.id} loading={isLoading}/>
      </Card>
    </div>);
}
