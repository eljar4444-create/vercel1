import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Sparkles, Stethoscope, ShieldCheck, Clock, Heart } from 'lucide-react';
import { SearchBar } from '@/components/search-bar';

export const dynamic = 'force-dynamic';

// Hardcoded fallback in case DB is unreachable (corporate firewall resilience)
const FALLBACK_CATEGORIES = [
    { id: 1, slug: 'beauty', name: 'Красота и Уход', icon: 'Sparkles' },
    { id: 2, slug: 'health', name: 'Медицина и Врачи', icon: 'Stethoscope' },
];

// Visual config per category slug — hardcoded for unique look
const ZONE_CONFIG: Record<string, {
    gradient: string;
    overlay: string;
    image: string;
    title: string;
    subtitle: string;
    cta: string;
    ctaStyle: string;
    ctaHref: string;
    icon: React.ReactNode;
    accentDot: string;
}> = {
    beauty: {
        gradient: 'from-rose-50 via-pink-50 to-amber-50',
        overlay: 'from-rose-900/60 via-pink-900/50 to-transparent',
        image: '/images/beauty-hero.png',
        title: 'Красота и Уход',
        subtitle: 'Идеальный маникюр, волосы и косметология.\nКачество, к которому мы привыкли.',
        cta: 'Смотреть мастеров',
        ctaStyle: 'bg-white/90 hover:bg-white text-rose-700 border border-rose-200 shadow-lg shadow-rose-200/50',
        ctaHref: '/search?category=beauty',
        icon: <Sparkles className="w-5 h-5" />,
        accentDot: 'bg-rose-400',
    },
    health: {
        gradient: 'from-teal-50 via-cyan-50 to-emerald-50',
        overlay: 'from-teal-900/60 via-teal-800/50 to-transparent',
        image: '/images/health-hero.png',
        title: 'Медицина и Врачи',
        subtitle: 'Врачи, которые говорят на вашем языке.\nБез барьеров и страха.',
        cta: 'Найти врача',
        ctaStyle: 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-400/30',
        ctaHref: '/search?category=health',
        icon: <Stethoscope className="w-5 h-5" />,
        accentDot: 'bg-teal-400',
    },
};

export default async function Home() {
    // Resilient data fetching — never crash on DB failure
    let categories = FALLBACK_CATEGORIES;
    try {
        const dbCategories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
        if (dbCategories && dbCategories.length > 0) {
            categories = dbCategories.map((c: any) => ({
                id: c.id,
                slug: c.slug,
                name: c.name,
                icon: c.icon,
            }));
        }
    } catch {
        // Firewall / connection issue — use fallback silently
    }

    const beautyCat = categories.find(c => c.slug === 'beauty');
    const healthCat = categories.find(c => c.slug === 'health');

    return (
        <div className="-mt-28">
            {/* ═══════════════════════════════════════════════ */}
            {/* SPLIT-SCREEN HERO                              */}
            {/* ═══════════════════════════════════════════════ */}
            <section className="relative min-h-screen flex flex-col lg:flex-row">
                {/* ── ZONE 1: BEAUTY (Planity Vibe) ── */}
                <div className="relative flex-1 min-h-[50vh] lg:min-h-screen group overflow-hidden">
                    {/* Background Image */}
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url('${ZONE_CONFIG.beauty.image}')` }}
                    />
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${ZONE_CONFIG.beauty.overlay}`} />
                    <div className="absolute inset-0 bg-rose-950/20" />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col justify-end h-full p-8 lg:p-14 pb-24 lg:pb-20">
                        <div className="max-w-lg animate-fade-in">
                            {/* Category Badge */}
                            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md text-white/90 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/20">
                                <Sparkles className="w-4 h-4" />
                                <span>Planity Vibe</span>
                            </div>

                            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-4 tracking-tight">
                                {ZONE_CONFIG.beauty.title}
                            </h2>
                            <p className="text-lg lg:text-xl text-white/80 leading-relaxed mb-8 whitespace-pre-line">
                                {ZONE_CONFIG.beauty.subtitle}
                            </p>
                            <Link
                                href={ZONE_CONFIG.beauty.ctaHref}
                                className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300 hover:-translate-y-0.5 ${ZONE_CONFIG.beauty.ctaStyle}`}
                            >
                                {ZONE_CONFIG.beauty.icon}
                                {ZONE_CONFIG.beauty.cta}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── ZONE 2: HEALTH (Doctolib Vibe) ── */}
                <div className="relative flex-1 min-h-[50vh] lg:min-h-screen group overflow-hidden">
                    {/* Background Image */}
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url('${ZONE_CONFIG.health.image}')` }}
                    />
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${ZONE_CONFIG.health.overlay}`} />
                    <div className="absolute inset-0 bg-teal-950/20" />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col justify-end h-full p-8 lg:p-14 pb-24 lg:pb-20">
                        <div className="max-w-lg animate-fade-in">
                            {/* Category Badge */}
                            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md text-white/90 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/20">
                                <Stethoscope className="w-4 h-4" />
                                <span>Doctolib Vibe</span>
                            </div>

                            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-4 tracking-tight">
                                {ZONE_CONFIG.health.title}
                            </h2>
                            <p className="text-lg lg:text-xl text-white/80 leading-relaxed mb-8 whitespace-pre-line">
                                {ZONE_CONFIG.health.subtitle}
                            </p>
                            <Link
                                href={ZONE_CONFIG.health.ctaHref}
                                className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300 hover:-translate-y-0.5 ${ZONE_CONFIG.health.ctaStyle}`}
                            >
                                {ZONE_CONFIG.health.icon}
                                {ZONE_CONFIG.health.cta}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════ */}
                {/* FLOATING SEARCH BAR — at the intersection      */}
                {/* ═══════════════════════════════════════════════ */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-8 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 w-[92%] max-w-2xl z-20 animate-slide-up">
                    <SearchBar />

                    {/* Quick category pills below search */}
                    <div className="flex items-center justify-center gap-3 mt-4">
                        {categories.map(cat => {
                            const config = ZONE_CONFIG[cat.slug];
                            if (!config) return null;
                            return (
                                <Link
                                    key={cat.slug}
                                    href={config.ctaHref}
                                    className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm text-gray-700 hover:text-gray-900 px-4 py-2 rounded-full text-sm font-medium border border-white/50 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                                >
                                    <span className={`w-2 h-2 rounded-full ${config.accentDot}`} />
                                    {cat.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════ */}
            {/* TRUST / VALUE PROPOSITION SECTION               */}
            {/* ═══════════════════════════════════════════════ */}
            <section className="bg-white py-20 lg:py-24">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                            Почему выбирают <span className="text-gradient">Svoi.de</span>
                        </h2>
                        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                            Единая платформа для русскоязычного сообщества в Германии
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                        {/* Card 1 */}
                        <div className="group text-center p-8 rounded-2xl hover:bg-gray-50 transition-all duration-300">
                            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Проверенные специалисты</h3>
                            <p className="text-gray-500 leading-relaxed">
                                Все мастера и врачи проходят верификацию. Мы гарантируем качество каждого профессионала.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="group text-center p-8 rounded-2xl hover:bg-gray-50 transition-all duration-300">
                            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-500 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Clock className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Быстрый поиск</h3>
                            <p className="text-gray-500 leading-relaxed">
                                Найдите нужного специалиста за секунды. Фильтрация по городу, категории и рейтингу.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="group text-center p-8 rounded-2xl hover:bg-gray-50 transition-all duration-300">
                            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Heart className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">На вашем языке</h3>
                            <p className="text-gray-500 leading-relaxed">
                                Все специалисты говорят по-русски. Без языкового барьера и недопонимания.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════ */}
            {/* CTA BOTTOM SECTION                              */}
            {/* ═══════════════════════════════════════════════ */}
            <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-20 lg:py-24">
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                        Вы — специалист?
                    </h2>
                    <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
                        Присоединяйтесь к сообществу профессионалов. Получайте заявки от клиентов, которые ищут именно вас.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/become-provider"
                            className="inline-flex items-center gap-2 bg-[#fc0] hover:bg-[#e6b800] text-gray-900 font-semibold px-8 py-4 rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl shadow-yellow-500/20"
                        >
                            <Sparkles className="w-5 h-5" />
                            Стать специалистом
                        </Link>
                        <Link
                            href="/search"
                            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-4 rounded-xl transition-all duration-300 border border-white/10"
                        >
                            Смотреть каталог
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
