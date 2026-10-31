import { translateUi, useSiteLanguage, formatDate } from '../../i18n/language';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellRing, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { platformApi } from "./platform-api";
import type { HubNotification } from "./live";
const ago = (iso: string) => {
    const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60)
        return "just now";
    const m = Math.round(s / 60);
    if (m < 60)
        return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24)
        return `${h} h ago`;
    return formatDate(iso, { day: "numeric", month: "short" });
};
/** Header bell: unread count, the latest 50 notifications, and live arrivals with a toast (and a desktop alert if allowed). */
export function NotificationBell() {
    useSiteLanguage();
    const [items, setItems] = useState<HubNotification[]>([]);
    const [query, setQuery] = useState(""), [onlyUnread, setOnlyUnread] = useState(false);
    const [unread, setUnread] = useState(0);
    const [open, setOpen] = useState(false);
    const [desktop, setDesktop] = useState(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    const navigate = useNavigate();
    const load = () => platformApi<{
        items: HubNotification[];
        unread: number;
    }>("/notifications").then((r) => { setItems(Array.isArray(r?.items) ? r.items : []); setUnread(Number(r?.unread) || 0); }).catch(() => { });
    useEffect(() => {
        void load();
        const poll = window.setInterval(() => void load(), 30000);
        const arrived = (e: Event) => {
            const n = (e as CustomEvent<HubNotification>).detail;
            setItems((list) => [n, ...list.filter((x) => x.id !== n.id)].slice(0, 50));
            setUnread((u) => u + 1);
            toast(translateUi(n.title), { description: n.body ? translateUi(n.body) : undefined, action: n.link ? { label: translateUi("Open"), onClick: () => navigate(n.link!) } : undefined });
            if (document.hidden && typeof Notification !== "undefined" && Notification.permission === "granted")
                new Notification(translateUi(n.title), { body: n.body ? translateUi(n.body) : undefined, icon: "/plp-dove.png", tag: n.id });
        };
        const read = () => void load();
        window.addEventListener("plp:notification", arrived);
        window.addEventListener("plp:notifications-read", read);
        return () => { window.clearInterval(poll); window.removeEventListener("plp:notification", arrived); window.removeEventListener("plp:notifications-read", read); };
    }, []);
    const markAll = async () => { setUnread(0); setItems((l) => l.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))); await platformApi("/notifications/read", "POST", {}).catch(() => { }); };
    const openItem = async (n: HubNotification) => {
        setOpen(false);
        if (!n.read_at) {
            setUnread((u) => Math.max(0, u - 1));
            setItems((l) => l.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
            void platformApi("/notifications/read", "POST", { ids: [n.id] }).catch(() => { });
        }
        if (n.link)
            navigate(n.link);
    };
    const shown = items.filter(n => (!onlyUnread || !n.read_at) && `${n.title} ${n.body}`.toLowerCase().includes(query.toLowerCase()));
    return (<Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="nb-trigger" aria-label={translateUi(unread ? `Notifications, ${unread} unread` : "Notifications")}>
          {translateUi(unread ? <BellRing size={19}/> : <Bell size={19}/>)}
          {translateUi(unread > 0 && <span className="nb-count">{translateUi(unread > 99 ? "99+" : unread)}</span>)}
        </button>
      </PopoverTrigger>
      <PopoverContent className="hub-app nb-panel" align="end">
        <header className="nb-head">
          <strong>{translateUi("Notifications")}</strong>
          {translateUi(unread > 0 && <button className="nb-link" onClick={() => void markAll()}><CheckCheck size={14}/>{translateUi(" Mark all read")}</button>)}
        </header>
        {translateUi(desktop === "default" && (<button className="nb-desktop" onClick={() => Notification.requestPermission().then(setDesktop)}>{translateUi("Turn on desktop alerts for when this tab is in the background")}</button>))}
        <div className="nb-filters"><input aria-label={translateUi('Search notifications')} placeholder={translateUi('Search notifications')} value={query} onChange={e=>setQuery(e.target.value)}/><label><input type="checkbox" checked={onlyUnread} onChange={e=>setOnlyUnread(e.target.checked)}/>{translateUi('Unread only')}</label></div>
        {translateUi(shown.length ? (<ul className="nb-list">
            {translateUi(shown.map((n) => (<li key={n.id}>
                <button className={n.read_at ? "" : "unread"} onClick={() => void openItem(n)}>
                  <span className="nb-dot" aria-hidden="true"/>
                  <span className="nb-text"><strong>{translateUi(n.title)}</strong>{translateUi(n.body && <small>{translateUi(n.body)}</small>)}<em>{translateUi(ago(n.created_at))}</em></span>
                </button>
              </li>)))}
          </ul>) : <p className="nb-empty">{translateUi(query || onlyUnread ? "No matching notifications." : "You're all caught up. New activities, requests and reviews will appear here.")}</p>)}
      </PopoverContent>
    </Popover>);
}
