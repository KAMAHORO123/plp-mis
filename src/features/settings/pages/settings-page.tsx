import { translateUi, useSiteLanguage } from '../../../i18n/language';
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/features/authentication/auth-context";
import { getInitials } from "@/lib/utils";

export function SettingsPage() {
    useSiteLanguage();
    const { user } = useAuth();
    const [name, setName] = useState(user?.name ?? "");
    const [email, setEmail] = useState(user?.email ?? "");
    const [saving, setSaving] = useState(false);
    const [prefs, setPrefs] = useState({
        emailAlerts: true,
        weeklyDigest: true,
        productUpdates: false,
    });
    const handleSave = async () => {
        setSaving(true);
        await new Promise((r) => setTimeout(r, 700));
        setSaving(false);
        toast.success(translateUi("Settings saved"));
    };
    return (<div className="space-y-6">
      <PageHeader title={translateUi("Settings")} description={translateUi("Manage your account, profile and notification preferences.")}/>

      <Card className="p-6">
        <h3 className="text-[15px] font-semibold tracking-tight">{translateUi("Profile")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{translateUi(" Update your personal information. ")}</p>
        <div className="mt-5 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.avatar} alt={translateUi(user?.name)}/>
            <AvatarFallback>{translateUi(getInitials(user?.name ?? "PL"))}</AvatarFallback>
          </Avatar>
          <Button variant="secondary" size="sm" onClick={() => toast.info(translateUi("Upload a new photo"))}>{translateUi(" Change photo ")}</Button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">{translateUi("Full name")}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)}/>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">{translateUi("Email")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}/>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-[15px] font-semibold tracking-tight">{translateUi("Notifications")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{translateUi(" Choose what updates you want to receive. ")}</p>
        <div className="mt-5 space-y-3">
          {translateUi([
            { key: "emailAlerts", label: "Email alerts for pending approvals" },
            { key: "weeklyDigest", label: "Weekly activity digest" },
            { key: "productUpdates", label: "Product updates and announcements" },
        ].map((item) => (<label key={item.key} className="flex items-center gap-3 text-sm text-foreground">
              <Checkbox checked={prefs[item.key as keyof typeof prefs]} onCheckedChange={(c) => setPrefs((p) => ({ ...p, [item.key]: c === true }))}/>
              {translateUi(item.label)}
            </label>))) }
        </div>
      </Card>

      <div className="flex justify-end gap-2.5">
        <Button variant="secondary" onClick={() => toast.info(translateUi("Changes discarded"))}>{translateUi(" Cancel ")}</Button>
        <Button onClick={handleSave} loading={saving}>{translateUi(" Save changes ")}</Button>
      </div>
    </div>);
}
