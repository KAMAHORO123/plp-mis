import { translateUi, useSiteLanguage } from '../../../i18n/language';
import { Link } from "react-router-dom";
import { ArrowRight, Award, CalendarDays, CheckCircle2, ClipboardList, Globe2, GraduationCap, Megaphone, MapPin, Sparkles, UsersRound, } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/shared/logo";
import { publicApi } from "@/api/services";
import { formatDate, formatNumber } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
type PublicEvent = {
    id?: string;
    name?: string;
    startsAt?: string;
    location?: string | null;
    school?: {
        name?: string;
        country?: string | null;
    };
};
type PublicActivity = {
    id?: string;
    name?: string;
    category?: string | null;
    occurredAt?: string;
    school?: {
        name?: string;
    };
};
type PublicAnnouncement = {
    id?: string;
    title?: string;
    content?: string;
    publishedAt?: string | null;
};
const pillars = [
    {
        title: "Character formation",
        description: "School communities practice servant leadership, integrity, and peace-building in everyday routines.",
        icon: GraduationCap,
    },
    {
        title: "Verified participation",
        description: "Activities, meetings, certificates, and member records stay traceable from school level to national office.",
        icon: CheckCircle2,
    },
    {
        title: "National visibility",
        description: "Events and announcements flow from the MIS into a public portal that families and partners can trust.",
        icon: Globe2,
    },
];
const fallbackAnnouncements: PublicAnnouncement[] = [
    {
        id: "welcome",
        title: "Welcome to the PLP public portal",
        content: "Published announcements from the national office will appear here as they are released.",
    },
];
function safeDate(value?: string | null) {
    return value ? formatDate(value) : "To be announced";
}
export function PublicWebsitePage() {
    useSiteLanguage();
    const { data, isFetching } = useQuery({
        queryKey: ["public-website"],
        queryFn: () => publicApi.website(),
    });
    const events = (data?.upcomingEvents ?? []) as PublicEvent[];
    const activities = (data?.recentActivities ?? []) as PublicActivity[];
    const announcements = ((data?.nationalAnnouncements?.length
        ? data.nationalAnnouncements
        : fallbackAnnouncements) ?? []) as PublicAnnouncement[];
    const heroMetrics = [
        { label: "Upcoming events", value: events.length, icon: CalendarDays },
        { label: "Verified activities", value: activities.length, icon: ClipboardList },
        { label: "Public notices", value: announcements.length, icon: Megaphone },
    ];
    const featuredEvent = events[0];
    const spotlightActivity = activities[0];
    const syncedAt = data?.syncedAt ? formatDate(data.syncedAt) : isFetching ? "Syncing now" : "Live from MIS";
    return (<div className="min-h-screen bg-[#f7faf9] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo subtitle="Public Portal"/>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
            <a href="#impact" className="transition hover:text-slate-950">{translateUi("Impact")}</a>
            <a href="#events" className="transition hover:text-slate-950">{translateUi("Events")}</a>
            <a href="#announcements" className="transition hover:text-slate-950">{translateUi("Announcements")}</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/auth/login">{translateUi("Sign in")}</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth/signup">{translateUi(" Join PLP ")}<ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
          <img src="/landing-hero.png" alt={translateUi("PLP youth leaders collaborating in a bright learning space")} className="absolute inset-0 h-full w-full object-cover object-center"/>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(248,250,252,0.98)_0%,rgba(248,250,252,0.9)_34%,rgba(248,250,252,0.48)_62%,rgba(15,23,42,0.18)_100%)]"/>
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#f7faf9] to-transparent"/>

          <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center px-4 pb-20 pt-12 sm:px-6 lg:px-8">
            <div className="max-w-2xl animate-fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-sm font-semibold text-emerald-800 shadow-card backdrop-blur">
                <Sparkles className="size-4"/>{translateUi(" Peace & Love Proclaimers ")}</div>
              <h1 className="mt-6 max-w-xl font-display text-5xl font-bold leading-[1.02] tracking-normal text-slate-950 sm:text-6xl lg:text-7xl">{translateUi(" PLP Public Portal ")}</h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-700 sm:text-xl">{translateUi(" A live window into school communities building peace, leadership, and service through verified activities, events, and national updates. ")}</p>
              {translateUi(isFetching && !data && (<p className="mt-4 text-sm font-semibold text-slate-600">{translateUi(" Loading the latest MIS feed in the background... ")}</p>))}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-slate-950 hover:bg-slate-800">
                  <Link to="/auth/signup">{translateUi(" Register your school ")}<ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg" className="bg-white/85">
                  <a href="#events">{translateUi(" Explore events ")}<CalendarDays />
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-6 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-3">
              {translateUi(heroMetrics.map((metric) => {
            const Icon = metric.icon;
            return (<div key={metric.label} className="flex items-center gap-3 rounded-lg border border-white/70 bg-white/86 p-4 shadow-card backdrop-blur">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-slate-950 text-white">
                      <Icon className="size-5"/>
                    </span>
                    <div>
                      <p className="text-2xl font-bold leading-none">{translateUi(formatNumber(metric.value))}</p>
                      <p className="mt-1 text-sm font-medium text-slate-600">{translateUi(metric.label)}</p>
                    </div>
                  </div>);
        }))}
            </div>
          </div>
        </section>

        <section id="impact" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">{translateUi("Built for trust")}</p>
              <h2 className="mt-3 max-w-xl font-display text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">{translateUi(" One public story, backed by one national source of truth. ")}</h2>
            </div>
            <p className="text-base leading-7 text-slate-600">{translateUi(" The public site is synced directly from the MIS, so families, partner schools, and national teams can see what is happening without chasing spreadsheets or scattered updates. ")}</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {translateUi(pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (<Card key={pillar.title} className="rounded-lg border-white bg-white/90 p-6 shadow-card-hover">
                  <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5"/>
                  </span>
                  <h3 className="mt-5 text-lg font-bold tracking-normal">{translateUi(pillar.title)}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{translateUi(pillar.description)}</p>
                </Card>);
        }))}
          </div>
        </section>

        <section id="events" className="bg-white py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">{translateUi("Live schedule")}</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-normal sm:text-4xl">{translateUi(" Events moving from local schools to national momentum. ")}</h2>

              <Card className="mt-8 overflow-hidden rounded-lg border-slate-200 bg-slate-950 text-white shadow-dropdown">
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                    <Award className="size-4"/>{translateUi(" Featured next ")}</div>
                  <h3 className="mt-5 text-2xl font-bold tracking-normal">
                    {translateUi(featuredEvent?.name ?? "No published events yet")}
                  </h3>
                  <div className="mt-5 space-y-3 text-sm text-slate-300">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="size-4 text-emerald-300"/>
                      {translateUi(safeDate(featuredEvent?.startsAt))}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="size-4 text-emerald-300"/>
                      {translateUi(featuredEvent?.location ?? featuredEvent?.school?.name ?? "Location will be shared soon")}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-3">
              {translateUi((events.length ? events.slice(0, 5) : [{ id: "empty", name: "Published events will appear here" }]).map((event) => (<Card key={event.id ?? event.name} className="rounded-lg border-slate-200 bg-[#f8fbfa] p-5 shadow-none">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-primary">{translateUi(safeDate(event.startsAt))}</p>
                      <h3 className="mt-1 text-lg font-bold tracking-normal">{translateUi(event.name)}</h3>
                      <p className="mt-1 text-sm text-slate-600">{translateUi(event.school?.name ?? "National program")}</p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                      <MapPin className="size-4 text-primary"/>
                      {translateUi(event.location ?? event.school?.country ?? "TBA")}
                    </span>
                  </div>
                </Card>)))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">{translateUi("Recent activity")}</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-normal sm:text-4xl">{translateUi(" Verified work from the field, surfaced beautifully. ")}</h2>
            <div className="mt-8 grid gap-3">
              {translateUi((activities.length ? activities.slice(0, 4) : [{ id: "empty", name: "Approved activities will appear here" }]).map((activity) => (<div key={activity.id ?? activity.name} className="rounded-lg border border-white bg-white/90 p-5 shadow-card">
                  <div className="flex items-start gap-4">
                    <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <UsersRound className="size-5"/>
                    </span>
                    <div>
                      <h3 className="font-bold tracking-normal">{translateUi(activity.name)}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {translateUi(activity.school?.name ?? "School community")}{translateUi(" \u00B7 ")}{translateUi(safeDate(activity.occurredAt))}
                      </p>
                    </div>
                  </div>
                </div>)))}
            </div>
          </div>

          <Card className="rounded-lg border-white bg-white p-6 shadow-card-hover">
            <div className="flex h-full flex-col justify-between gap-10">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">{translateUi("Spotlight")}</p>
                <h3 className="mt-4 text-3xl font-bold tracking-normal">
                  {translateUi(spotlightActivity?.name ?? "Every approved activity strengthens the national record.")}
                </h3>
                <p className="mt-4 leading-7 text-slate-600">
                  {translateUi(spotlightActivity
            ? `${spotlightActivity.school?.name ?? "A PLP school"} recorded this activity on ${safeDate(spotlightActivity.occurredAt)}.`
            : "Once coordinators approve activity reports, they are ready for public visibility and national reporting.")}
                </p>
              </div>
              <div className="rounded-lg bg-[#edf7f3] p-5">
                <p className="text-sm font-semibold text-slate-600">{translateUi("Last synced")}</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{translateUi(syncedAt)}</p>
              </div>
            </div>
          </Card>
        </section>

        <section id="announcements" className="bg-slate-950 py-20 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">{translateUi("National desk")}</p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-normal sm:text-4xl">{translateUi(" Official announcements, cleanly published. ")}</h2>
              </div>
              <Button asChild variant="secondary" className="bg-white text-slate-950 hover:bg-slate-100">
                <Link to="/auth/login">{translateUi(" Open dashboard ")}<ArrowRight />
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {translateUi(announcements.slice(0, 3).map((announcement) => (<Card key={announcement.id ?? announcement.title} className="rounded-lg border-white/10 bg-white/[0.06] p-5 text-white shadow-none">
                  <Megaphone className="size-5 text-emerald-300"/>
                  <h3 className="mt-5 text-lg font-bold tracking-normal">{translateUi(announcement.title)}</h3>
                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-300">{translateUi(announcement.content)}</p>
                  <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {translateUi(safeDate(announcement.publishedAt))}
                  </p>
                </Card>)))}
            </div>
          </div>
        </section>
      </main>
    </div>);
}
