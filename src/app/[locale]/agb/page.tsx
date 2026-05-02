import React from 'react';
import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';
import type { Metadata } from 'next';
import { localizedAlternates, resolveLocale } from '@/i18n/canonical';

export async function generateMetadata({
    params,
}: {
    params: { locale: string };
}): Promise<Metadata> {
    return {
        title: 'AGB — Allgemeine Nutzungsbedingungen | Svoi.de',
        alternates: localizedAlternates(resolveLocale(params.locale), '/agb'),
    };
}

export default function AgbPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl font-sans text-slate-900">
            <h1 className="text-3xl font-bold mb-8">Allgemeine Nutzungsbedingungen (AGB)</h1>
            <p className="text-gray-600 mb-8">für die Webseite Svoi.de</p>

            <ScrollReveal>
                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 border-b pb-2">Präambel</h2>
                    <p className="text-gray-700 leading-relaxed">
                        Diese Webseite (Svoi.de) ist eine Plattform zur Vermittlung und Online-Terminbuchung von Beauty- und Wellness-Dienstleistungen (nachfolgend „Portal“). Das Portal befindet sich derzeit in einer kostenlosen Beta-Phase. Zweck des Portals ist die Bereitstellung einer technischen Infrastruktur (Software-as-a-Service), die es Dienstleistern ermöglicht, ihre Angebote zu präsentieren, und Nutzern (Kunden) erlaubt, diese Dienstleister zu finden und Termine anzufragen.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 border-b pb-2">§ 1 Geltungsbereich</h2>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Die nachfolgenden Nutzungsbedingungen gelten für die Nutzung der Webseite Svoi.de sowie aller dazugehörigen Unterseiten.
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Nutzer im Sinne dieser Bedingungen sind sowohl Besucher, die Inhalte abrufen, als auch Anbieter (Dienstleister), die Inhalte (z. B. Profile, Bilder, Texte) bereitstellen.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        Entgegenstehende oder von diesen Nutzungsbedingungen abweichende Bedingungen des Nutzers werden nicht anerkannt, es sei denn, der Betreiber hat ihrer Geltung ausdrücklich schriftlich zugestimmt.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 border-b pb-2">§ 2 Leistungsbeschreibung und Verfügbarkeit</h2>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Der Betreiber stellt eine technische Infrastruktur bereit, die es Anbietern ermöglicht, ihre Dienstleistungen in Form von Profilen auf Svoi.de darzustellen.
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
                        <li>
                            <strong>Art der Bereitstellung (Technische Bereitstellung):</strong> Das Portal dient ausschließlich als technische Infrastruktur, die es Nutzern ermöglicht, eigenständig Informationen abzurufen und Kontakt zu Anbietern aufzunehmen. Der Betreiber tritt nicht als Vermittler im rechtlichen Sinne auf. Ein Maklervertrag oder ein sonstiges Vermittlungsverhältnis zwischen dem Betreiber und dem Nutzer kommt nicht zustande. Alle Interaktionen und Terminvereinbarungen finden außerhalb der rechtlichen Verantwortung des Betreibers statt.
                        </li>
                        <li>
                            <strong>Unentgeltlichkeit:</strong> Die Nutzung des Portals ist für alle Beteiligten dauerhaft kostenlos, da es sich um ein reines Portfolio-Projekt ohne Gewinnerzielungsabsicht handelt.
                        </li>
                        <li>
                            <strong>Verfügbarkeit:</strong> Da es sich um ein privates Projekt handelt, übernimmt der Betreiber keine Gewähr für die ständige Verfügbarkeit der Webseite. Wartungsarbeiten, Serverausfälle oder technische Störungen können zu vorübergehenden Einschränkungen führen. Ein Anspruch auf Nutzung besteht nicht.
                        </li>
                    </ul>
                </section>
            </ScrollReveal>

            <ScrollReveal>
                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 border-b pb-2">§ 3 Registrierung und Nutzerkonto</h2>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Für die Erstellung eines Eintrags kann eine Registrierung erforderlich sein. Der Nutzer ist verpflichtet, bei der Registrierung wahrheitsgemäße Angaben zu machen.
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Der Nutzer ist verpflichtet, seine Zugangsdaten geheim zu halten und vor dem Zugriff Dritter zu schützen. Sollte der Nutzer Kenntnis von einem Missbrauch seines Kontos erlangen, ist er verpflichtet, den Betreiber unverzüglich zu informieren.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        Der Betreiber behält sich das Recht vor, Registrierungen ohne Angabe von Gründen abzulehnen oder bestehende Konten zu deaktivieren.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 border-b pb-2">§ 4 Verantwortlichkeit für Inhalte und Erwerbsberechtigung</h2>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        <strong>Verantwortlichkeit:</strong> Für die Inhalte der Profile (Texte, Bilder, Links, Preisangaben) ist ausschließlich der jeweilige Nutzer/Anbieter verantwortlich. Der Betreiber macht sich diese Inhalte nicht zu eigen.
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        <strong>Erwerbsberechtigung (§ 18b AufenthG u.a.):</strong> Nutzer, die sich als Dienstleister (Anbieter) registrieren, bestätigen mit der Nutzung, dass sie über die notwendige Erwerbsberechtigung (z.B. gemäß ihrem Aufenthaltstitel) für die Ausübung ihrer Tätigkeit in Deutschland verfügen. Der Betreiber übernimmt keine Prüfung der rechtlichen Arbeitserlaubnis oder der gewerberechtlichen Voraussetzungen der Nutzer. Das Portal dient lediglich der technischen Demonstration.
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        <strong>Verbotene Inhalte:</strong> Es ist strengstens untersagt, Inhalte auf Svoi.de zu veröffentlichen, die:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed mb-4">
                        <li>gegen geltendes deutsches Recht verstoßen;</li>
                        <li>Rechte Dritter verletzen (insb. Urheber-, Marken- oder Persönlichkeitsrechte);</li>
                        <li>pornografisch, gewaltverherrlichend, rassistisch oder diskriminierend sind;</li>
                        <li>Viren, Trojaner oder andere schädliche Software enthalten.</li>
                    </ul>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        <strong>Täuschungsverbot:</strong> Es ist untersagt, falsche Tatsachen zu behaupten oder irreführende Angaben über die Qualität oder Eigenschaften von Dienstleistungen zu machen.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        <strong>Steuern und Abgaben:</strong> Svoi.de ist an den Transaktionen zwischen Kunden und Dienstleistern in keiner Weise finanziell beteiligt. Sämtliche Zahlungen für gebuchte Dienstleistungen erfolgen direkt zwischen Kunde und Dienstleister (z.B. vor Ort). Der Dienstleister ist allein und vollumfänglich dafür verantwortlich, alle Einnahmen, die über das Portal generiert werden, ordnungsgemäß den zuständigen Steuerbehörden (Finanzamt) zu melden und abzuführen.
                    </p>
                </section>

                <section className="mb-8" id="vertragsverhaeltnisse">
                    <h2 className="text-2xl font-bold mb-4 border-b pb-2">§ 5 Vertragsverhältnisse und Stornierungen</h2>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        <strong>1. Zwei-Parteien-Verhältnis:</strong> Über Svoi.de geschlossene Verträge über Beauty- oder Wellness-Dienstleistungen kommen ausschließlich zwischen dem Nutzer (Kunde) und dem jeweiligen Dienstleister (Anbieter) zustande. Svoi.de wird nicht Vertragspartei dieser Dienstleistungsverträge.
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        <strong>2. Haftung für Leistungen:</strong> Svoi.de haftet nicht für die Qualität, Sicherheit oder Rechtmäßigkeit der angebotenen Dienstleistungen. Ebenso haftet Svoi.de nicht für Zahlungsausfälle von Kunden oder nicht wahrgenommene Termine (No-Shows).
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        <strong>3. Stornierungen:</strong> Die Bedingungen für die Stornierung von Terminen richten sich ausschließlich nach den individuellen AGB oder Stornierungsrichtlinien des jeweiligen Dienstleisters.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 border-b pb-2">§ 6 Einräumung von Nutzungsrechten</h2>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Mit dem Hochladen von Inhalten (z. B. Fotos des Salons, Logos, Beschreibungstexte) räumt der Nutzer dem Betreiber ein einfaches, unentgeltliches, räumlich und zeitlich unbeschränktes Nutzungsrecht an den jeweiligen Inhalten ein.
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Dieses Nutzungsrecht umfasst das Recht, die Inhalte auf der Plattform zu speichern, zu vervielfältigen und öffentlich zugänglich zu machen (Online-Darstellung auf Svoi.de).
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        Der Nutzer versichert, dass er über alle erforderlichen Rechte an den eingestellten Inhalten verfügt und keine Rechte Dritter verletzt.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 border-b pb-2">§ 7 Freistellung von Ansprüchen</h2>
                    <p className="text-gray-700 leading-relaxed">
                        Der Nutzer stellt den Betreiber von sämtlichen Ansprüchen Dritter frei, die diese aufgrund einer Rechtsverletzung durch die vom Nutzer eingestellten Inhalte gegen den Betreiber geltend machen. Dies umfasst auch die Kosten einer angemessenen Rechtsverteidigung.
                    </p>
                </section>
            </ScrollReveal>

            <ScrollReveal>
                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 border-b pb-2">§ 8 Haftungsbeschränkung</h2>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Der Betreiber haftet unbeschränkt nur für Vorsatz und grobe Fahrlässigkeit.
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Für einfache Fahrlässigkeit haftet der Betreiber nur bei Verletzung wesentlicher Pflichten, deren Erfüllung die ordnungsgemäße Durchführung des Nutzungsverhältnisses überhaupt erst ermöglicht (Kardinalpflichten). In diesem Fall ist die Haftung auf den typischen, vorhersehbaren Schaden begrenzt.
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Insbesondere haftet der Betreiber nicht für:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
                        <li>die Richtigkeit und Vollständigkeit der von Nutzern eingestellten Daten;</li>
                        <li>die Qualität der Dienstleistungen der Anbieter;</li>
                        <li>technische Störungen, Datenverluste oder Schäden durch Schadsoftware.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 border-b pb-2">§ 9 Datenschutz</h2>
                    <p className="text-gray-700 leading-relaxed">
                        Der Schutz personenbezogener Daten hat höchste Priorität. Die Erhebung und Verarbeitung von Daten erfolgt ausschließlich im Rahmen der gesetzlichen Bestimmungen (DSGVO). Details sind in der Datenschutzerklärung geregelt (<Link href="/datenschutz" className="text-blue-600 hover:underline">zur Datenschutzerklärung</Link>).
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 border-b pb-2">§ 10 Beendigung der Nutzung</h2>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Anbieter können jederzeit die Löschung ihres Profils verlangen (per E-Mail an: <a href="mailto:eliar.mamedov@outlook.com" className="text-blue-600 hover:underline">eliar.mamedov@outlook.com</a>).
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        Der Betreiber ist berechtigt, Profile ohne Angabe von Gründen zu löschen, insbesondere wenn diese gegen § 4 verstoßen.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 border-b pb-2">§ 11 Schlussbestimmungen</h2>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Es gilt das Recht der Bundesrepublik Deutschland.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        Sollten einzelne Bestimmungen dieser Nutzungsbedingungen unwirksam sein oder werden, so bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
                    </p>
                </section>
            </ScrollReveal>
        </div>
    );
}
