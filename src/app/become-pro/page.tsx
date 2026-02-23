import Link from 'next/link';
import { Scissors, Building2, ArrowRight } from 'lucide-react';

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

export default function BecomeProPage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 px-4 py-16">
            {/* Header */}
            <h1 className="text-3xl font-bold text-gray-900 text-center tracking-tight">
                Станьте партнером Svoi.de
            </h1>
            <p className="mt-2 text-base text-gray-500 text-center max-w-md">
                Присоединяйтесь к платформе и начните получать новых клиентов онлайн.
            </p>

            {/* Cards */}
            <div className="mt-10 w-full max-w-lg space-y-4">
                {OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                        <Link
                            key={option.href}
                            href={option.href}
                            className="
                                group flex items-center gap-5 w-full rounded-xl border border-gray-200
                                bg-white p-5 shadow-sm
                                transition-all duration-200
                                hover:border-slate-900 hover:shadow-md
                                active:scale-[0.99]
                            "
                        >
                            {/* Icon */}
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-colors group-hover:bg-slate-900 group-hover:text-white">
                                <Icon className="h-5 w-5" />
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <p className="text-base font-semibold text-gray-900">{option.title}</p>
                                <p className="mt-0.5 text-sm text-gray-500">{option.description}</p>
                            </div>

                            {/* Arrow */}
                            <ArrowRight className="h-5 w-5 shrink-0 text-gray-300 transition-all duration-200 group-hover:text-slate-900 group-hover:translate-x-1" />
                        </Link>
                    );
                })}
            </div>

            {/* Back link */}
            <Link
                href="/"
                className="mt-8 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
                ← Вернуться на главную
            </Link>
        </main>
    );
}
