import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Search results and link previews show these. Keep each description under about 160 characters.
export const SITE_ORIGIN = 'https://plpyouth.org';
const NAME = 'Peace and Love Proclaimers';
const pages: Record<string, { title: string; description: string }> = {
  '/': { title: `${NAME} (PLP) — Youth for Change`, description: 'Peace and Love Proclaimers (PLP) is a youth-led organization in Rwanda advancing peace, leadership, culture, wellness and community service since 2007.' },
  '/about': { title: `About PLP — ${NAME}`, description: 'PLP is a youth-led organization creating future leaders through unity, peace and youth development, in Rwanda and beyond.' },
  '/programmes': { title: `Our programmes — ${NAME}`, description: 'PLP programmes bring the mission into practice: Walk to Remember, PLP Academy, MegaCare, arts, dialogue, wellness and community service.' },
  '/stories': { title: `Our impact — ${NAME}`, description: 'Milestones in youth leadership, community service and peacebuilding, including Walk to Remember, held in more than 25 countries since 2009.' },
  '/album': { title: `PLP album — ${NAME}`, description: 'Photos from PLP Academy, community gatherings, Walk to Remember and other Peace and Love Proclaimers moments.' },
  '/plp-canada': { title: `PLP Canada — ${NAME}`, description: 'PLP Canada connects young people of Rwandan heritage in Canada, brought together by peace, love and a shared future.' },
  '/live-quiz': { title: `Live quiz — ${NAME}`, description: 'Join a PLP live quiz with the game PIN, play from your phone in meetings, classes and conferences, or host your own quiz.' },
  '/plp-hub': { title: `PLP Hub — ${NAME}`, description: 'The PLP Hub is where members learn, find opportunities, earn certificates and keep their PLP journey in one place.' },
};
const notFound = { title: `Page not found — ${NAME}`, description: pages['/'].description };

function setMeta(selector: string, attr: 'content' | 'href', value: string) {
  document.head.querySelector(selector)?.setAttribute(attr, value);
}

/** Keeps the page title, description and canonical address in step with the current route. */
export function useRouteSeo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/';
    const page = pages[path];
    const { title, description } = page ?? notFound;
    const url = SITE_ORIGIN + (path === '/' ? '/' : path);
    document.title = title;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('link[rel="canonical"]', 'href', url);
    // Unknown addresses render the "not found" page; keep them out of search results.
    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!page) {
      if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.append(robots); }
      robots.content = 'noindex';
    } else robots?.remove();
  }, [pathname]);
}
