import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Download,
  Plus,
  Bell,
  CheckCircle2,
  CheckCheck,
  Info,
  AlertTriangle,
  X,
  ListFilter,
  CalendarRange,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchBar } from "@/components/shared/search-bar";
import { PageHeader } from "@/components/shared/page-header";
import { DetailDialog } from "@/components/shared/detail-dialog";
import { useNotifications, useEvents } from "@/hooks/use-queries";
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/hooks/use-mutations";
import { generateReport } from "@/lib/actions";
import { cn, formatDate } from "@/lib/utils";
import type { AppNotification } from "@/types";

const TABS = [
  { id: "all", label: "All Updates & Notifications" },
  { id: "requests", label: "Requests" },
  { id: "reports", label: "System Reports" },
];

const ICON_MAP = {
  success: { icon: CheckCircle2, className: "text-success" },
  info: { icon: Info, className: "text-primary" },
  warning: { icon: AlertTriangle, className: "text-warning" },
} as const;

export function NotificationsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [toView, setToView] = useState<AppNotification | null>(null);
  const { data: notifications = [] } = useNotifications();
  const { data: events = [] } = useEvents();
  const deleteNotification = useDeleteNotification();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const visible = notifications.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || n.type === typeFilter;
    const matchesTab =
      tab === "all" ||
      (tab === "requests" && n.title.toLowerCase().includes("request")) ||
      (tab === "reports" && n.title.toLowerCase().includes("report"));
    return matchesSearch && matchesType && matchesTab;
  });

  const handleDismiss = async (id: string) => {
    try {
      await deleteNotification.mutateAsync(id);
      toast.success("Notification removed");
    } catch {
      toast.error("Could not remove notification");
    }
  };

  const handleView = async (item: AppNotification) => {
    setToView(item);
    if (!item.read) {
      await markRead.mutateAsync(item.id);
    }
  };

  const handleMarkRead = async (item: AppNotification) => {
    try {
      await markRead.mutateAsync(item.id);
      toast.success("Notification marked read");
    } catch {
      toast.error("Could not mark notification read");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="National Notifications & Alerts"
        description="Real-time system updates and governance alerts."
        actions={
          <>
            <Button variant="secondary" onClick={() => generateReport("Events report")}>
              <Download />
              Generate Events Report
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                await markAllRead.mutateAsync();
                toast.success("All notifications marked read");
              }}
            >
              <CheckCheck />
              Mark All Read
            </Button>
            <Button onClick={() => navigate("/events")}>
              <Plus />
              Create a New Event
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-1 border-b border-border">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn("-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors", tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground">
              <Bell className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Alerts & Notifications</p>
              <p className="text-xs text-muted-foreground">System and governance updates</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchBar value={search} onChange={setSearch} placeholder="Search notifications" />
            </div>
            <Button variant="secondary" size="sm" onClick={() => setTypeFilter(typeFilter === "all" ? "info" : typeFilter === "info" ? "warning" : typeFilter === "warning" ? "success" : "all")}>
              <ListFilter />
              {typeFilter === "all" ? "All" : typeFilter}
            </Button>
          </div>

          <div className="space-y-3">
            {visible.map((item) => {
              const { icon: Icon, className } = ICON_MAP[item.type];
              return (
                <Card key={item.id} className={cn("relative p-4", !item.read && "border-primary/40 bg-primary/5")}>
                  <button onClick={() => handleDismiss(item.id)} className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground/60 hover:bg-secondary" aria-label="Dismiss">
                    <X className="h-4 w-4" />
                  </button>
                  <div className="flex gap-3">
                    <Icon className={cn("h-5 w-5 shrink-0", className)} />
                    <div className="pr-4">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{item.message}</p>
                      <div className="mt-3 flex items-center gap-4 text-sm font-medium">
                        <button onClick={() => handleDismiss(item.id)} className="text-muted-foreground hover:text-foreground">Delete</button>
                        {!item.read && (
                          <button onClick={() => handleMarkRead(item)} className="text-muted-foreground hover:text-foreground">Mark read</button>
                        )}
                        <button onClick={() => handleView(item)} className="text-primary hover:underline">View changes</button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground">
                <CalendarRange className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Upcoming Events</p>
                <p className="text-xs text-muted-foreground">Published events from the MIS</p>
              </div>
            </div>
            <button onClick={() => navigate("/events")} className="text-sm font-medium text-primary hover:underline">
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {events.slice(0, 5).map((event) => (
              <Card key={event.id} className="p-4">
                <p className="text-sm font-semibold">{event.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{event.school} · {event.location ?? event.district}</p>
                <p className="mt-2 text-xs text-muted-foreground">{formatDate(event.date)}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <DetailDialog
        open={!!toView}
        onOpenChange={(open) => !open && setToView(null)}
        title={toView?.title ?? "Notification"}
        fields={toView ? [
          { label: "Type", value: toView.type },
          { label: "Message", value: toView.message },
          { label: "Read", value: toView.read ? "Yes" : "No" },
        ] : []}
      />
    </div>
  );
}
