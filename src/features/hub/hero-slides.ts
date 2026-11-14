// The homepage slideshow. Administrators can replace these slides in the Content studio (Website banner tab);
// the site loads them from /api/public/hero-slides and keeps the built-in slides when none are saved.
import { useEffect, useState } from "react";

export interface HeroSlide { image: string; position: string; name: string; title: string; text: string; cta: string; to: string }

// Every slide has the same two-line heading: a name in gold, then what it is about in light blue.
export const builtInSlides: HeroSlide[] = [
    { image: "/images/plp/albums/camp-8.jpg", position: "center 35%", name: "PLP Hub", title: "Learn and lead.", text: "Courses, mentoring and real opportunities for young people, all in one place.", to: "/plp-hub", cta: "Discover the PLP Hub" },
    { image: "/images/plp/plp-walk-to-remember.webp", position: "center 60%", name: "Walk to Remember", title: "Walk as one.", text: "Every year, thousands walk with us to remember and to stand as one for unity.", to: "/about", cta: "Our story" },
    { image: "/images/plp/plp-arts.webp", position: "center 40%", name: "Arts & culture", title: "Create freely.", text: "Art, music and expression that bring young people together.", to: "/programmes", cta: "Our programmes" },
    { image: "/images/plp/albums/academy-8.jpg", position: "center 30%", name: "PLP Academy", title: "Grow together.", text: "A youth-led community rooted in Rwanda, reaching beyond borders.", to: "/programmes", cta: "Explore our work" },
    { image: "/images/plp/plp-dialogue.webp", position: "center 55%", name: "Dialogue", title: "Speak up.", text: "Dialogue that turns young voices into action.", to: "/stories", cta: "Our impact" },
];

/** Built-in photos are site paths; uploaded ones are served by id. */
export const slideImage = (image: string) => image.startsWith("/") ? image : `/api/public/hero-slides/image/${image}`;

const CACHE = "plp-hero-slides";
const remembered = (): HeroSlide[] | null => {
    // The last answer is remembered so returning visitors see the right slides at once: [] means the built-in ones.
    try {
        const value = JSON.parse(localStorage.getItem(CACHE) || "null");
        return Array.isArray(value) ? (value.length ? value : builtInSlides) : null;
    }
    catch { return null; }
};

/** The slides to show; null while a first-time visitor's request is still on its way. */
export function useHeroSlides(): HeroSlide[] | null {
    const [slides, setSlides] = useState<HeroSlide[] | null>(remembered);
    useEffect(() => {
        const controller = new AbortController();
        const fallback = window.setTimeout(() => setSlides(s => s ?? builtInSlides), 2500);
        const load = () => fetch("/api/public/hero-slides", { signal: controller.signal, cache: "no-store" })
            .then(r => r.ok ? r.json() : Promise.reject(new Error("unavailable")))
            .then((value: { slides?: HeroSlide[] }) => {
                const custom = Array.isArray(value.slides) ? value.slides : [];
                setSlides(custom.length ? custom : builtInSlides);
                try { localStorage.setItem(CACHE, JSON.stringify(custom)); } catch { /* storage may be blocked */ }
            })
            .catch((e: Error) => { if (e.name !== "AbortError") setSlides(s => s ?? builtInSlides); });
        void load();
        window.addEventListener("plp:hero-slides-updated", load);
        return () => { controller.abort(); clearTimeout(fallback); window.removeEventListener("plp:hero-slides-updated", load); };
    }, []);
    return slides;
}
