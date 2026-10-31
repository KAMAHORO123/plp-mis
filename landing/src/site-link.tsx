import { useSiteLanguage } from './i18n/language';
import { Link, type LinkProps } from 'react-router-dom';
const systemPaths = ['/auth/signup', '/auth/login', '/hub', '/courses'];
export function SiteLink(props: LinkProps) {
    const language = useSiteLanguage();
    const path = typeof props.to === 'string' ? props.to : '';
    if (systemPaths.some(p => path === p || path.startsWith(p + '/'))) {
        const base = import.meta.env.VITE_HUB_URL?.replace(/\/$/, '');
        const { to: _, ...rest } = props;
        // The Hub is on another address, so the chosen language travels with the link.
        const withLanguage = (url: string) => url + (url.includes('?') ? '&' : '?') + `lang=${language}`;
        return <a {...rest} href={base ? withLanguage(`${base}${path}`) : '/plp-hub#availability'}/>;
    }
    return <Link {...props}/>;
}
