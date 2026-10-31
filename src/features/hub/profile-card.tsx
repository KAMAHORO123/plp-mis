import { translateUi, useSiteLanguage } from '../../i18n/language';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useHub } from './store';
import { ProfilePhoto } from './profile-photo';
import { Panel, Tag } from './ui';
export interface ProfileStat {
    label: string;
    value: string | number;
    icon: LucideIcon;
}
/** The identity card shared by the youth passport and staff profiles, so every role's profile looks the same. */
export function ProfileCard({ kicker, subtitle, actions, bio, stats }: {
    kicker: string;
    subtitle?: string;
    actions: ReactNode;
    bio?: string;
    stats: ProfileStat[];
}) {
    useSiteLanguage();
    const { profile } = useHub();
    const since = new Date(`${profile.joined}T00:00:00`);
    return (<section className="pv-id" aria-label={translateUi(kicker.toLowerCase())}>
      <div className="pv-cover">
        <span>{translateUi(kicker)}</span>
        <span className="pv-number">{translateUi("No. PLP-")}{translateUi(profile.id.replace(/[^a-z0-9]/gi, '').slice(-8).toUpperCase())}</span>
      </div>
      <div className="pv-identity">
        <ProfilePhoto size={112} badge/>
        <div className="pv-name">
          <h1>{translateUi(profile.name)}</h1>
          <p>
            <Tag>{translateUi(profile.role)}</Tag>
            {translateUi(subtitle && <span>{translateUi(subtitle)}</span>)}
            {translateUi(profile.joined && <span>{translateUi("Member since ")}{translateUi(isNaN(since.getTime()) ? profile.joined : since.toLocaleDateString('en', { month: 'long', year: 'numeric' }))}</span>)}
          </p>
        </div>
        <div className="pv-actions">{translateUi(actions)}</div>
      </div>
      <p className="pv-bio">{translateUi(bio || profile.bio || 'Add a short bio so people know what you care about.')}</p>
      <dl className="pv-stats">
        {translateUi(stats.map(({ label, value, icon: Icon }) => <div key={label}><dt><Icon size={18} aria-hidden="true"/>{translateUi(label)}</dt><dd>{translateUi(value)}</dd></div>))}
      </dl>
    </section>);
}
export function ProfilePanel({ icon: Icon, title, children }: {
    icon: LucideIcon;
    title: string;
    children: ReactNode;
}) {
    useSiteLanguage();
    return <Panel className="pv-panel"><header><span className="pv-icon"><Icon size={17}/></span><h2>{translateUi(title)}</h2></header>{translateUi(children)}</Panel>;
}
