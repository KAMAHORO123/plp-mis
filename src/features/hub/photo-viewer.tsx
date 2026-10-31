import { translateUi, useSiteLanguage } from '../../i18n/language';
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import "./photo-viewer.css";
/** Any image marked `data-zoom` opens here full size when clicked or activated with Enter/Space. */
export function PhotoViewer() {
    useSiteLanguage();
    const [photo, setPhoto] = useState<{ src: string; alt: string } | null>(null);
    useEffect(() => {
        const open = (e: Event) => {
            const img = (e.target as HTMLElement | null)?.closest?.("img[data-zoom]") as HTMLImageElement | null;
            if (!img || (e instanceof KeyboardEvent && e.key !== "Enter" && e.key !== " "))
                return;
            e.preventDefault();
            setPhoto({ src: img.currentSrc || img.src, alt: img.alt });
        };
        document.addEventListener("click", open);
        document.addEventListener("keydown", open);
        return () => { document.removeEventListener("click", open); document.removeEventListener("keydown", open); };
    }, []);
    return <Dialog open={!!photo} onOpenChange={(o) => { if (!o) setPhoto(null); }}>
      <DialogContent className="hub-app pv-viewer max-w-[min(560px,92vw)]">
        <DialogTitle className="pv-viewer-title">{photo?.alt || translateUi("Profile picture")}</DialogTitle>
        {photo && <img src={photo.src} alt={photo.alt}/>}
      </DialogContent>
    </Dialog>;
}
