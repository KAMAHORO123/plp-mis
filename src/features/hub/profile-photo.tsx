import "./profile-photo.css";
import { translateUi, useSiteLanguage } from '../../i18n/language';
import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { confirmAction } from "@/components/shared/confirm-dialog";
import { platformApi, uploadFile } from "./platform-api";
import { useHub } from "./store";
const MAX_BYTES = 2 * 1024 * 1024;
export const initialsOf = (name: string) => name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
/** Shows the signed-in person's picture (or initials) with upload and remove controls. */
/** `badge` shows a small camera button on the photo instead of the full upload controls. */
export function ProfilePhoto({ size = 96, editable = true, badge = false }: {
    size?: number;
    editable?: boolean;
    badge?: boolean;
}) {
    useSiteLanguage();
    const { profile } = useHub();
    const input = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [broken, setBroken] = useState("");
    const changed = () => { window.dispatchEvent(new Event("plp:profile-updated")); window.dispatchEvent(new Event("plp:mentorship-updated")); };
    const upload = async (file: File) => {
        if (!["image/png", "image/jpeg"].includes(file.type))
            return toast.error(translateUi("Choose a PNG or JPEG photo."));
        if (file.size > MAX_BYTES)
            return toast.error(translateUi("Choose a photo smaller than 2 MB."));
        setBusy(true);
        try {
            await platformApi("/me/avatar", "PUT", { file_id: await uploadFile(file) });
            changed();
            toast.success(translateUi("Profile picture updated"));
        }
        catch (e) {
            toast.error(translateUi((e as Error).message));
        }
        finally {
            setBusy(false);
            if (input.current)
                input.current.value = "";
        }
    };
    const remove = async () => {
        if (!await confirmAction({ title: "Remove your profile picture?", description: "Your initials will be shown instead.", confirmLabel: "Remove", destructive: true }))
            return;
        setBusy(true);
        try {
            await platformApi("/me/avatar", "PUT", { file_id: null });
            changed();
            toast.success(translateUi("Profile picture removed"));
        }
        catch (e) {
            toast.error(translateUi((e as Error).message));
        }
        finally {
            setBusy(false);
        }
    };
    if (badge)
        return (<div className="pp-badge" style={{ width: size, height: size }}>
      <div className="pp-frame" style={{ width: size, height: size, fontSize: size / 3 }}>
        {translateUi(profile.avatarUrl && broken !== profile.avatarUrl ? <img data-zoom tabIndex={0} role="button" src={profile.avatarUrl} alt={translateUi("{p0}'s profile picture", { p0: translateUi(profile.name) })} onError={() => setBroken(profile.avatarUrl!)}/> : <span>{translateUi(initialsOf(profile.name))}</span>)}
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f)
            void upload(f); }} aria-label={translateUi("Upload profile picture")}/>
      {editable && <button type="button" className="pp-badge-button" disabled={busy} title={translateUi("Change photo (PNG or JPEG, up to 2 MB)")} aria-label={translateUi(profile.avatarUrl ? "Change profile picture" : "Add profile picture")} onClick={() => input.current?.click()}><Camera size={15}/></button>}
      {editable && profile.avatarUrl && <button type="button" className="pp-remove-button" disabled={busy} aria-label={translateUi("Remove profile picture")} title={translateUi("Remove photo")} onClick={() => void remove()}><Trash2 size={14}/></button>}
    </div>);
    return (<div className="pp-photo">
      <div className="pp-frame" style={{ width: size, height: size, fontSize: size / 3 }}>
        {translateUi(profile.avatarUrl && broken !== profile.avatarUrl ? <img data-zoom tabIndex={0} role="button" src={profile.avatarUrl} alt={translateUi("{p0}'s profile picture", { p0: translateUi(profile.name) })} onError={() => setBroken(profile.avatarUrl!)}/> : <span>{translateUi(initialsOf(profile.name))}</span>)}
      </div>
      {translateUi(editable && (<div className="pp-controls">
          <input ref={input} type="file" accept="image/png,image/jpeg" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f)
            void upload(f); }} aria-label={translateUi("Upload profile picture")}/>
          <button type="button" className="hub-button secondary" disabled={busy} onClick={() => input.current?.click()}><Camera size={15}/> {translateUi(busy ? "Uploading…" : profile.avatarUrl ? "Change photo" : "Upload photo")}</button>
          {translateUi(profile.avatarUrl && <button type="button" className="hub-record-icon hub-record-delete" disabled={busy} aria-label={translateUi("Remove profile picture")} title={translateUi("Remove photo")} onClick={() => void remove()}><Trash2 size={16}/></button>)}
          <small>{translateUi("PNG or JPEG, up to 2 MB")}</small>
        </div>))}
    </div>);
}
