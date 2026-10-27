import { translateUi, useSiteLanguage } from '../../../i18n/language';
import { useState } from "react";
import { Mail, Phone, MessageCircle, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
const CHANNELS = [
    {
        icon: Mail,
        title: "Email us",
        detail: "info@peaceloveproclaimers.org",
        action: () => (window.location.href = "mailto:info@peaceloveproclaimers.org"),
    },
    {
        icon: Phone,
        title: "Call us",
        detail: "+250 788 236 141",
        action: () => (window.location.href = "tel:+250788236141"),
    },
    {
        icon: BookOpen,
        title: "Documentation",
        detail: "Browse guides & FAQs",
        action: () => toast.info(translateUi("Opening documentation")),
    },
];
const FAQS = [
    {
        q: "How do I verify a school chapter?",
        a: "Open the Schools page, find the chapter, and use the Edit action to update its verification status.",
    },
    {
        q: "How do I generate a report?",
        a: "Use the “Generate a Report” button on the Overview or Schools page to export the current view.",
    },
    {
        q: "How are pending approvals handled?",
        a: "Pending items appear in the activity tables. Use the Approve action to confirm them.",
    },
];
export function SupportPage() {
    useSiteLanguage();
    const [sending, setSending] = useState(false);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        await new Promise((r) => setTimeout(r, 700));
        setSending(false);
        setSubject("");
        setMessage("");
        toast.success(translateUi("Your message has been sent. We'll get back to you soon."));
    };
    return (<div className="space-y-6">
      <PageHeader title={translateUi("Support")} description={translateUi("Get help with the PLP National Dashboard.")}/>

      <div className="grid gap-4 sm:grid-cols-3">
        {translateUi(CHANNELS.map((c) => (<Card key={c.title} className="p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
              <c.icon className="h-5 w-5"/>
            </div>
            <h3 className="mt-3 text-[15px] font-semibold tracking-tight">
              {translateUi(c.title)}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{translateUi(c.detail)}</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={c.action}>{translateUi(" Contact ")}</Button>
          </Card>)))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-[18px] w-[18px] text-primary"/>
            <h3 className="text-[15px] font-semibold tracking-tight">{translateUi(" Send us a message ")}</h3>
          </div>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="subject">{translateUi("Subject")}</Label>
              <Input id="subject" placeholder={translateUi("What do you need help with?")} value={subject} onChange={(e) => setSubject(e.target.value)} required/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">{translateUi("Message")}</Label>
              <textarea id="message" rows={5} placeholder={translateUi("Describe your issue\u2026")} value={message} onChange={(e) => setMessage(e.target.value)} required className="flex w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"/>
            </div>
            <Button type="submit" loading={sending}>{translateUi(" Send message ")}</Button>
          </form>
        </Card>

        <Card className="p-6">
          <h3 className="text-[15px] font-semibold tracking-tight">{translateUi(" Frequently asked questions ")}</h3>
          <div className="mt-4 divide-y divide-border">
            {translateUi(FAQS.map((f) => (<div key={f.q} className="py-3">
                <p className="text-sm font-medium text-foreground">{translateUi(f.q)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{translateUi(f.a)}</p>
              </div>)))}
          </div>
        </Card>
      </div>
    </div>);
}
