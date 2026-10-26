export interface Announcement {
 endsAt?: string;
 enabled: boolean;
 title: string;
 date: string;
 location: string;
 href: string;
 linkLabel: string;
 sample: boolean;
}
export const defaultAnnouncement: Announcement = {
 enabled: true, title: 'Sober Campaign · An evening of music & connection',
 date: '2026-11-14', location: 'Kigali', href: '/programmes#wellness', linkLabel: 'Explore event', sample: true,
};
export function safeAnnouncementLink(value: string) {
 if (/^\/(?!\/)/.test(value) && !/[\\\s]/.test(value)) return true;
 try { return new URL(value).protocol === 'https:'; } catch { return false; }
}
export const socialLinks = [
 { name: 'Instagram', url: 'https://www.instagram.com/plpyouth/' },
 { name: 'Canada Instagram', url: 'https://www.instagram.com/plpyouthca/' },
 { name: 'LinkedIn', url: 'https://www.linkedin.com/company/peaceandloveproclaimers' },
 { name: 'X / Twitter', url: 'https://x.com/plpyouth' },
];
export const albums = [
 { id:'academy', title:'PLP Academy 2024', description:'Learning, confidence, and new possibilities.', photos:['academy-2','academy-1','academy-3','academy-4','academy-5','academy-6','academy-7','academy-8','academy-9','academy-10'] },
 { id:'gathering', title:'Community gatherings', description:'Ideas shared. Connections made.', photos:['gathering-1','gathering-2','gathering-3','gathering-4','gathering-5','gathering-6','gathering-7','gathering-8','gathering-9','gathering-10'] },
 { id:'archive', title:'From the PLP archive', description:'The moments that brought us here.', photos:['archive-1','archive-2','archive-3','archive-4','archive-5','archive-6','archive-7','archive-8','archive-9','archive-10'] },
 { id:'camp', title:'Camp diaries', description:'A little movement. A lot of togetherness.', photos:['camp-1','camp-2','camp-3','camp-4','camp-5','camp-6','camp-7','camp-8','camp-9','camp-10'] },
];
