import { getToken } from "@/api/client";
import { reportsApi } from "@/api/services";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

export async function downloadReportFile(id: string, filename: string) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/reports/${id}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function generateAndDownloadReport(data: {
  name: string;
  category: string;
  rangeStart: string;
  rangeEnd: string;
  format: "PDF" | "XLS" | "CSV";
}) {
  const report = await reportsApi.generate(data) as { id: string; name: string; format: string };
  const ext = report.format === "PDF" ? "pdf" : report.format === "XLS" ? "xlsx" : "csv";
  await downloadReportFile(report.id, `${report.name}.${ext}`);
  return report;
}
