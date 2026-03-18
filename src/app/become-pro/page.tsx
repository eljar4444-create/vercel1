import Link from 'next/link';
import { ArrowRight, BadgeCheck, BellRing, Building2, Clock3, Scissors } from 'lucide-react';

const OPTIONS = [
    {
        href: '/auth/login?role=provider&type=INDIVIDUAL',
        icon: Scissors,
        title: 'Я частный мастер',
        description: 'Работаю на дому, на выезде или арендую кресло.',
    },
    {
        href: '/auth/login?role=provider&type=SALON',
        icon: Building2,
        title: 'Я владелец салона',
        description: 'У меня своя студия, салон красоты и сотрудники.',
    },
] as const;

const HIGHLIGHTS = [
    { icon: BadgeCheck, text: '0€ абонентская плата' },
    { icon: BellRing, text: 'Telegram уведомления' },
    { icon: Clock3, text: '5 минут на регистрацию' },
] as const;

export default function BecomeProPage() {
    return (
        <main className="relative min-h-screen w-full overflow-hidden bg-[#FDFCF8] text-slate-900">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(244,228,205,0.45),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(230,214,190,0.35),_transparent_30%)]" />
            <div
                className="absolute inset-0 opacity-[0.45]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            <Link
                href="/"
                className="absolute left-6 top-6 z-10 text-sm text-slate-500 transition-colors hover:text-slate-900"
            >
                ← На главную
            </Link>

            <section className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-20 sm:px-6">
                <div className="grid w-full gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
                    <div className="flex flex-col justify-center">
                        <p className="inline-flex w-fit rounded-full border border-stone-200 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500 shadow-sm">
                            Для мастеров в Германии
                        </p>

                        <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl xl:text-6xl">
                            Принимайте записи онлайн без лишней рутины
                        </h1>

                        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                            Русскоязычная платформа для мастеров и салонов в Германии. Подключитесь один раз и начните
                            принимать новых клиентов уже сегодня.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                            {HIGHLIGHTS.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.text}
                                        className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
                                    >
                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-emerald-600">
                                            <Icon className="h-4 w-4" />
                                        </span>
                                        <span>{item.text}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center lg:justify-end">
                        <div className="w-full rounded-[2rem] border border-stone-200 bg-white p-5 text-slate-900 shadow-lg shadow-stone-200/60 md:p-6">
                            <h2 className="text-2xl font-black tracking-tight text-slate-900">
                                Как вы работаете?
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-stone-500">
                                Выберите формат работы, и мы подскажем правильный сценарий регистрации.
                            </p>

                            <div className="mt-6 space-y-4">
                                {OPTIONS.map((option) => {
                                    const Icon = option.icon;
                                    return (
                                        <Link
                                            key={option.href}
                                            href={option.href}
                                            className="group flex w-full items-center gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-5 shadow-md shadow-stone-100 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-lg active:scale-[0.99]"
                                        >
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-stone-600 shadow-sm transition-colors group-hover:bg-slate-900 group-hover:text-white">
                                                <Icon className="h-5 w-5" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="text-base font-semibold text-slate-900">{option.title}</p>
                                                <p className="mt-1 text-sm leading-6 text-stone-500">{option.description}</p>
                                            </div>

                                            <ArrowRight className="h-5 w-5 shrink-0 text-stone-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-slate-900" />
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
