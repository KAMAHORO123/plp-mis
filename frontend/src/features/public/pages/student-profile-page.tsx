import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { PageLoader } from "@/components/shared/page-loader";
import { StatusBadge } from "@/components/shared/status-badge";
import { publicApi } from "@/api/services";
import { formatDate } from "@/lib/utils";
import type { StudentProfile } from "@/types";

export function StudentProfilePage() {
  const { qrCode } = useParams<{ qrCode: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["student-profile", qrCode],
    queryFn: () => publicApi.studentProfile(qrCode!) as Promise<StudentProfile>,
    enabled: !!qrCode,
  });

  if (isLoading) return <PageLoader />;
  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="max-w-md p-8 text-center">
          <h1 className="text-lg font-semibold">Profile Not Found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This QR code does not match any registered PLP member.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">PLP Student Profile</p>
          <h1 className="mt-2 text-2xl font-bold">{data.name}</h1>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Member ID</dt><dd className="font-medium">{data.memberId}</dd></div>
            <div><dt className="text-muted-foreground">School</dt><dd className="font-medium">{data.school}</dd></div>
            <div><dt className="text-muted-foreground">Join Date</dt><dd className="font-medium">{formatDate(data.joinDate)}</dd></div>
            <div><dt className="text-muted-foreground">Graduation Status</dt><dd className="font-medium">{data.graduationStatus}</dd></div>
            {data.className && <div><dt className="text-muted-foreground">Class</dt><dd className="font-medium">{data.className}</dd></div>}
          </dl>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">Activities Participated</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.activitiesParticipated.length === 0 && (
              <li className="text-muted-foreground">No activities recorded.</li>
            )}
            {data.activitiesParticipated.map((a) => (
              <li key={a.id} className="flex justify-between border-b border-border py-2 last:border-0">
                <span>{a.name}</span>
                <span className="text-muted-foreground">{formatDate(a.occurredAt)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">Certificates Earned</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {data.certificatesEarned.length === 0 && (
              <li className="text-muted-foreground">No certificates yet.</li>
            )}
            {data.certificatesEarned.map((c) => (
              <li key={c.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                <div>
                  <p className="font-medium">{c.activityName}</p>
                  <p className="text-xs text-muted-foreground">{c.number}</p>
                </div>
                <StatusBadge status={String(c.status).toLowerCase() as "issued"} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
