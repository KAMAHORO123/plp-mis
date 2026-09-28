import { useState } from "react";
import { Download, Eye, FileText, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateReport } from "@/lib/actions";
import { downloadReportFile } from "@/lib/reports";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatCardGrid } from "@/components/shared/stat-card-grid";
import { DataTable, type Column } from "@/components/shared/data-table";
import { RowAction, RowActions } from "@/components/shared/row-actions";
import { DetailDialog } from "@/components/shared/detail-dialog";
import { type TimeRange } from "@/components/shared/time-range-tabs";
import { useReports } from "@/hooks/use-queries";
import { useGenerateReport } from "@/hooks/use-mutations";
import {
  reportPerformanceStats,
  reportImpactStats,
  reportReadinessStats,
} from "@/api/mock/metrics";
import type { Report } from "@/types";

function StatSection({ title, description, stats }: { title: string; description: string; stats: typeof reportPerformanceStats }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <StatCardGrid metrics={stats} columns={4} />
    </section>
  );
}

export function ReportsPage() {
  const [range, setRange] = useState<TimeRange>("12m");
  const { data = [], isLoading } = useReports();
  const generate = useGenerateReport();
  const [reportType, setReportType] = useState("program");
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [toView, setToView] = useState<Report | null>(null);

  const columns: Column<Report>[] = [
    {
      id: "name",
      header: "Report Name",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="font-medium text-foreground">{row.name}</span>
        </div>
      ),
      sortable: true,
      sortValue: (row) => row.name,
    },
    { id: "category", header: "Report Category", cell: (row) => row.category },
    { id: "range", header: "Date Range", cell: (row) => row.dateRange },
    { id: "generated", header: "Generated On", cell: (row) => row.generatedOn },
    { id: "format", header: "Format", cell: (row) => <Badge variant={row.format === "PDF" ? "danger" : "success"}>{row.format}</Badge> },
    {
      id: "action",
      header: "Action",
      cell: (row) => (
        <RowActions>
          <RowAction icon={Download} label="Download" variant="primary" onClick={async () => {
            try {
              const ext = row.format === "PDF" ? "pdf" : row.format === "XLS" ? "xlsx" : "csv";
              await downloadReportFile(row.id, `${row.name}.${ext}`);
              toast.success("Download started");
            } catch {
              toast.error("Download failed");
            }
          }} />
          <RowAction icon={Eye} label="View" variant="primary" onClick={() => setToView(row)} />
        </RowActions>
      ),
    },
  ];

  const handleGenerate = async () => {
    try {
      const names: Record<string, string> = {
        program: "Program Summary Report",
        compliance: "School Compliance Report",
        certification: "Certification Issuance Report",
        impact: "District Impact Report",
      };
      await generate.mutateAsync({
        name: names[reportType] ?? "Custom Report",
        category: reportType,
        rangeStart: new Date(startDate).toISOString(),
        rangeEnd: new Date(endDate).toISOString(),
        format: "PDF",
      });
      toast.success("Report generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Generate, view, and download national reports."
        actions={<Button onClick={() => generateReport("Analytics report")}>Generate a Report <Download /></Button>}
      />

      <FilterBar range={range} onRangeChange={setRange} rangeOptions={["all", "12m", "30d", "7d", "24h"]} />
      <StatSection title="National Program Performance Report" description="Overview of school participation and engagement." stats={reportPerformanceStats} />
      <StatSection title="National Impact Summary" description="Verified outcomes nationwide." stats={reportImpactStats} />
      <StatSection title="Reporting & Verification Readiness" description="School compliance and verification performance." stats={reportReadinessStats} />

      <section className="space-y-4">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Generate New Report</p>
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label>Type Of Report</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="program">Program Summary</SelectItem>
                    <SelectItem value="compliance">School Compliance</SelectItem>
                    <SelectItem value="certification">Certification Issuance</SelectItem>
                    <SelectItem value="impact">District Impact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">End Date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <Button className="w-full" onClick={handleGenerate} loading={generate.isPending}>
                <CalendarCheck className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <DataTable columns={columns} data={data} getRowId={(row) => row.id} loading={isLoading} selectable />
          </Card>
        </div>
      </section>

      <DetailDialog
        open={!!toView}
        onOpenChange={(open) => !open && setToView(null)}
        title={toView?.name ?? "Report"}
        fields={toView ? [
          { label: "Category", value: toView.category },
          { label: "Date Range", value: toView.dateRange },
          { label: "Generated", value: toView.generatedOn },
          { label: "Format", value: toView.format },
        ] : []}
      />
    </div>
  );
}
