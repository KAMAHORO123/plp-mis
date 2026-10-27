import { translateUi, useSiteLanguage } from '../../../i18n/language';
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/features/authentication/auth-context";
import { schoolsApi } from "@/api/services";
import { useUpdateSchool } from "@/hooks/use-mutations";
export function CoordinatorProfilePage() {
    useSiteLanguage();
    const { user } = useAuth();
    const updateSchool = useUpdateSchool();
    const [form, setForm] = useState({
        name: "",
        district: "",
        contactEmail: "",
        contactPhone: "",
        coordinatorName: "",
        coordinatorPhone: "",
        coordinatorEmail: "",
        logoUrl: "",
    });
    useEffect(() => {
        if (!user?.schoolId)
            return;
        schoolsApi.get(user.schoolId).then((school) => {
            setForm({
                name: String(school.name ?? ""),
                district: String(school.district ?? ""),
                contactEmail: String(school.contactEmail ?? ""),
                contactPhone: String(school.contactPhone ?? ""),
                coordinatorName: String(school.coordinatorName ?? ""),
                coordinatorPhone: String(school.coordinatorPhone ?? ""),
                coordinatorEmail: String(school.coordinatorEmail ?? ""),
                logoUrl: String(school.logoUrl ?? ""),
            });
        });
    }, [user?.schoolId]);
    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.schoolId)
            return;
        try {
            await updateSchool.mutateAsync({ id: user.schoolId, data: { ...form, name: form.name.trim().toUpperCase() } });
            toast.success(translateUi("School profile updated"));
        }
        catch (err) {
            toast.error(translateUi(err instanceof Error ? err.message : "Update failed"));
        }
    };
    return (<div className="space-y-6">
      <PageHeader title={translateUi("School Profile")} description={translateUi("Update your school information and contact details.")}/>
      <Card className="p-5">
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div><Label>{translateUi("School Name")}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })}/></div>
          <div><Label>{translateUi("District")}</Label><Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}/></div>
          <div><Label>{translateUi("Logo URL")}</Label><Input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}/></div>
          <div><Label>{translateUi("Contact Email")}</Label><Input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}/></div>
          <div><Label>{translateUi("Contact Phone")}</Label><Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}/></div>
          <div><Label>{translateUi("Coordinator Name")}</Label><Input value={form.coordinatorName} onChange={(e) => setForm({ ...form, coordinatorName: e.target.value })}/></div>
          <div><Label>{translateUi("Coordinator Phone")}</Label><Input value={form.coordinatorPhone} onChange={(e) => setForm({ ...form, coordinatorPhone: e.target.value })}/></div>
          <div><Label>{translateUi("Coordinator Email")}</Label><Input value={form.coordinatorEmail} onChange={(e) => setForm({ ...form, coordinatorEmail: e.target.value })}/></div>
          <div className="sm:col-span-2"><Button type="submit" loading={updateSchool.isPending}>{translateUi("Save Changes")}</Button></div>
        </form>
      </Card>
    </div>);
}
