import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useHub } from './store';
import { ProfilePhoto } from './profile-photo';
import { Panel, Tag } from './ui';

export interface ProfileStat { label: string; value: string | number; icon: LucideIcon }

/** The identity card shared by the youth passport and staff profiles, so every role's profile looks the same. */
export function ProfileCard({ kicker, subtitle, actions, bio, stats }: { kicker: string; subtitle?: string; actions: ReactNode; bio?: string; stats: ProfileStat[] }) {
  const { profile } = useHub();
  const since = new Date(`${profile.joined}T00:00:00`);
  return (
    <section className="pv-id" aria-label={kicker.toLowerCase()}>
      <div className="pv-cover">
        <span>{kicker}</span>
        <span className="pv-number">No. PLP-{profile.id.replace(/[^a-z0-9]/gi, '').slice(-8).toUpperCase()}</span>
      </div>
      <div className="pv-identity">
        <ProfilePhoto size={112} badge />
        <div className="pv-name">
          <h1>{profile.name}</h1>
          <p>
            <Tag>{profile.role}</Tag>
            {subtitle && <span>{subtitle}</span>}
            {profile.joined && <span>Member since {isNaN(since.getTime()) ? profile.joined : since.toLocaleDateString('en', { month: 'long', year: 'numeric' })}</span>}
          </p>
        </div>
        <div className="pv-actions">{actions}</div>
      </div>
      <p className="pv-bio">{bio || profile.bio || 'Add a short bio so people know what you care about.'}</p>
      <dl className="pv-stats">
        {stats.map(({ label, value, icon: Icon }) => <div key={label}><Icon size={18} /><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
    </section>
  );
}

export function ProfilePanel({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return <Panel className="pv-panel"><header><span className="pv-icon"><Icon size={17} /></span><h2>{title}</h2></header>{children}</Panel>;
}
