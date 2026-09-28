import { useState } from "react";
import { Check, GraduationCap, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { RowAction, RowActions } from "@/components/shared/row-actions";
import { useMembers } from "@/hooks/use-queries";
import { useCreateMember, useUpdateMember } from "@/hooks/use-mutations";
import { useAuth } from "@/features/authentication/auth-context";
import type { Member } from "@/types";

export function CoordinatorMembersPage() {
  const { user } = useAuth();
  const { data = [], isLoading } = useMembers();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    memberCode: "",
    affiliation: "",
    district: "",
    className: "",
  });

  const setStatus = async (member: Member, status: "ACTIVE" | "INACTIVE" | "GRADUATED") => {
    try {
      await updateMember.mutateAsync({
        id: member.id,
        data: {
          status,
          ...(status === "GRADUATED" ? { kind: "GRADUATE" } : {}),
        },
      });
      toast.success(`${member.name} marked ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update member");
    }
  };

  const columns: Column<Member>[] = [
    { id: "name", header: "Name", cell: (row) => row.name },
    { id: "memberId", header: "Member ID", cell: (row) => row.memberId },
    { id: "role", header: "Role", cell: (row) => row.role },
    { id: "district", header: "District", cell: (row) => row.district },
    { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <RowActions>
          <RowAction icon={Check} label="Mark active" variant="success" onClick={() => setStatus(row, "ACTIVE")} />
          <RowAction icon={X} label="Mark inactive" variant="danger" onClick={() => setStatus(row, "INACTIVE")} />
          <RowAction icon={GraduationCap} label="Mark graduated" variant="primary" onClick={() => setStatus(row, "GRADUATED")} />
        </RowActions>
      ),
    },
  ];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMember.mutateAsync({
        ...form,
        kind: "STUDENT",
        schoolId: user?.schoolId,
      });
      toast.success("Member added");
      setShowForm(false);
      setForm({ name: "", memberCode: "", affiliation: "", district: "", className: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description="Manage students and members for your school."
        actions={
          <Button onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        }
      />
      {showForm && (
        <Card className="p-5">
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><Label>Member ID</Label><Input value={form.memberCode} onChange={(e) => setForm({ ...form, memberCode: e.target.value })} required /></div>
            <div><Label>Class</Label><Input value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} /></div>
            <div><Label>District</Label><Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} required /></div>
            <div className="sm:col-span-2"><Label>Affiliation</Label><Input value={form.affiliation} onChange={(e) => setForm({ ...form, affiliation: e.target.value })} required /></div>
            <div className="sm:col-span-2"><Button type="submit" loading={createMember.isPending}>Save Member</Button></div>
          </form>
        </Card>
      )}
      <Card className="p-5">
        <DataTable columns={columns} data={data} getRowId={(row) => row.id} loading={isLoading} />
      </Card>
    </div>
  );
}
