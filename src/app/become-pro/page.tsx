import Link from 'next/link';
import { Scissors, Building2, ArrowRight, BadgeCheck, BellRing, Clock3 } from 'lucide-react';

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
    { icon: BadgeCheck, text: 'Бесплатно на старте' },
    { icon: BellRing, text: 'Telegram уведомления' },
    { icon: Clock3, text: '5 минут на регистрацию' },
] as const;

export default function BecomeProPage() {
    return (
        <main className="min-h-screen overflow-hidden bg-[#F7F3EE] text-slate-900">
            <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-stone-800 text-white">
                <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />
                <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-amber-300/15 blur-3xl" />
                <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

                <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-6">
                    <div className="grid w-full gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-10">
                        <div className="flex flex-col justify-center">
                            <p className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-200">
                                Для мастеров в Германии
                            </p>
                            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl xl:text-6xl">
                                Принимайте записи онлайн — бесплатно
                            </h1>
                            <p className="mt-5 max-w-2xl text-base leading-7 text-stone-200 sm:text-lg">
                                Русскоязычная платформа. Ваши клиенты найдут вас на своём языке.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                                {HIGHLIGHTS.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={item.text} className="inline-flex items-center gap-2 text-sm font-medium text-stone-100">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-emerald-300">
                                                <Icon className="h-4 w-4" />
                                            </span>
                                            <span>{item.text}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <Link
                                href="/"
                                className="mt-8 inline-flex w-fit text-sm text-stone-300 transition-colors hover:text-white"
                            >
                                ← Вернуться на главную
                            </Link>
                        </div>

                        <div className="flex items-center lg:justify-end">
                            <div className="w-full rounded-[2rem] border border-white/10 bg-white/95 p-5 text-slate-900 shadow-[0_25px_80px_rgba(15,23,42,0.35)] backdrop-blur md:p-6">
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
                                    Подключение
                                </p>
                                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                                    Как вы работаете?
                                </h2>

                                <div className="mt-6 space-y-4">
                                    {OPTIONS.map((option) => {
                                        const Icon = option.icon;
                                        return (
                                            <Link
                                                key={option.href}
                                                href={option.href}
                                                className="group flex w-full items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-900 hover:shadow-md active:scale-[0.99]"
                                            >
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-600 transition-colors group-hover:bg-slate-900 group-hover:text-white">
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
                </div>
            </section>
        </main>
    );
}
