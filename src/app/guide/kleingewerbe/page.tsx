import React from 'react';
import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Как легально работать бьюти-мастером в Германии? | Svoi.de',
    description:
        'Пошаговое руководство по регистрации бизнеса для бьюти-мастеров в Германии. Kleingewerbe, Steuernummer и Kleinunternehmerregelung простым языком.',
};

export default function KleingewerbePage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl font-sans text-slate-900">
            <Link
                href="/dashboard?section=profile"
                className="mb-8 inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-700"
            >
                ← Назад в панель управления
            </Link>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Как легально работать бьюти-мастером в Германии?
            </h1>
            <p className="mt-2 text-lg text-slate-500">
                Kleingewerbe (Малое предпринимательство) — это проще и дешевле, чем вы думаете.
            </p>

            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
                <p className="font-semibold">💡 Без паники перед бюрократией!</p>
                <p className="mt-1 leading-relaxed">
                    Регистрация простая и недорогая. Всего за пару шагов вы сможете работать легально и уверенно.
                </p>
            </div>

            <ScrollReveal>
                <section className="mt-10">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-lg font-bold text-violet-700">
                            1
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Сколько это стоит?</h2>
                            <p className="mt-2 text-gray-700 leading-relaxed">
                                Оформление в местном ведомстве (Gewerbeamt) стоит всего один раз{' '}
                                <strong className="text-slate-900">от 20 до 40 евро</strong>. Дальше никаких скрытых взносов за сам статус. Вы можете сразу начинать работать.
                            </p>
                        </div>
                    </div>
                </section>
            </ScrollReveal>

            <ScrollReveal>
                <section className="mt-8 border-t border-slate-100 pt-8">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-lg font-bold text-amber-700">
                            2
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                Придется платить много налогов?
                            </h2>
                            <p className="mt-1 text-sm font-semibold text-amber-700">
                                Kleinunternehmerregelung (§ 19 UStG)
                            </p>
                            <p className="mt-2 text-gray-700 leading-relaxed">
                                <strong className="text-slate-900">Нет!</strong> Если ваш доход за год меньше{' '}
                                <strong className="text-slate-900">22 000 евро</strong>, вы{' '}
                                <strong className="text-emerald-700">
                                    НЕ платите НДС (MwSt 0%)
                                </strong>. Это невероятно упрощает ведение учета и бухгалтерию.
                            </p>
                        </div>
                    </div>
                </section>
            </ScrollReveal>

            <ScrollReveal>
                <section className="mt-8 border-t border-slate-100 pt-8">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-lg font-bold text-sky-700">
                            3
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                А если я на пособии (Bürgergeld / Jobcenter)?
                            </h2>
                            <p className="mt-2 text-gray-700 leading-relaxed">
                                Вы имеете полное право открыть Gewerbe, находясь на пособии. Часть вашего заработка будет вычитаться, но зато вы работаете на {' '}
                                <strong className="text-slate-900">100% легально</strong>, получаете стаж и строите свое будущее. Jobcenter даже приветствует это и может проконсультировать.
                            </p>
                        </div>
                    </div>
                </section>
            </ScrollReveal>

            <ScrollReveal>
                <section className="mt-8 border-t border-slate-100 pt-8">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-lg font-bold text-rose-700">
                            4
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Как получить Steuernummer?</h2>
                            <p className="mt-2 text-gray-700 leading-relaxed">
                                После регистрации в Gewerbeamt вам нужно заполнить анкету для налоговой (
                                <strong className="text-slate-900">
                                    «Fragebogen zur steuerlichen Erfassung»
                                </strong>{' '}
                                — это можно сделать онлайн через{' '}
                                <a
                                    href="https://www.elster.de"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline underline-offset-2 hover:text-blue-800"
                                >
                                    ELSTER
                                </a>
                                ). После этого вам пришлют ваш налоговый номер. Введите его в настройках Svoi.de — и ваш профиль станет виден клиентам!
                            </p>
                        </div>
                    </div>
                </section>
            </ScrollReveal>

            <ScrollReveal>
                <div className="mt-12 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-stone-50 p-6 text-center">
                    <p className="text-lg font-bold text-slate-900">Готовы начать?</p>
                    <p className="mt-1 text-sm text-slate-500">
                        Укажите свой налоговый номер в настройках, чтобы активировать профиль.
                    </p>
                    <Link
                        href="/dashboard?section=profile"
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
                    >
                        Перейти в профиль →
                    </Link>
                </div>
            </ScrollReveal>
        </div>
    );
}
