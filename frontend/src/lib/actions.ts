import { toast } from "sonner";
import { generateAndDownloadReport } from "@/lib/reports";

const REPORT_CATEGORIES: Record<string, string> = {
  "Schools registry report": "Schools",
  "Members registry report": "Members",
  "Certification report": "Certifications",
  "Events report": "Events",
  "Analytics report": "Analytics",
  "All reports archive": "Archive",
  "National activity report": "Activities",
  "National Dashboard Report": "Dashboard",
};

/** Generate and download a report via the API. */
export async function generateReport(name = "Report") {
  const category = REPORT_CATEGORIES[name] ?? "General";
  return toast.promise(
    generateAndDownloadReport({
      name,
      category,
      rangeStart: new Date(Date.now() - 30 * 86400000).toISOString(),
      rangeEnd: new Date().toISOString(),
      format: "PDF",
    }),
    {
      loading: `Generating ${name}…`,
      success: `${name} downloaded`,
      error: "Could not generate report",
    }
  );
}
