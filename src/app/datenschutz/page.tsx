import React from 'react';

export default function DatenschutzPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl font-sans text-slate-900">
            <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung (Beta-Version / Portfolio-Projekt)</h1>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 border-b pb-2">1. Allgemeiner Hinweis und Zweck der Webseite</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                    Die Webseite <strong>Svoi.de</strong> ist ein privates, nicht-kommerzielles Portfolio-Projekt, das zu Demonstrationszwecken im Rahmen der Softwareentwicklung erstellt wurde. Es erfolgt <strong>keine gewerbliche Nutzung</strong> und es werden <strong>keine Gebühren oder Zahlungen</strong> über diese Plattform abgewickelt. Alle Funktionen dienen der Veranschaulichung technischer Möglichkeiten.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 border-b pb-2">2. Verantwortliche Stelle</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                    Die verantwortliche Stelle für die Datenverarbeitung auf dieser Webseite ist:
                </p>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-gray-700 mb-4">
                    <p>Eliar Mamedov</p>
                    <p>Sophienstr. 22</p>
                    <p>95444, Bayreuth</p>
                    <p>E-Mail: <a href="mailto:eliar.mamedov@outlook.com" className="text-blue-600 hover:underline">eliar.mamedov@outlook.com</a></p>
                </div>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 border-b pb-2">3. Erfassung und Speicherung personenbezogener Daten</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                    Wir erfassen Daten nur, soweit dies für die Funktionalität des Demonstrationsprojekts erforderlich ist:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed mb-4">
                    <li><strong>Registrierung:</strong> Name, E-Mail-Adresse und Telefonnummer zur Erstellung von Test-Profilen.</li>
                    <li><strong>Dienstleister-Profile:</strong> Standortdaten (Stadt/Adresse) und Bilder von Dienstleistungen zur Veranschaulichung der Suchfunktion.</li>
                    <li><strong>Buchungen:</strong> Informationen über fiktive oder reale Terminanfragen werden ausschließlich zur Darstellung des Workflows im System gespeichert.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 border-b pb-2">4. Rechtsgrundlage (DSGVO)</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                    Da es sich um ein privates Projekt handelt, erfolgt die Verarbeitung auf Grundlage von:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed mb-4">
                    <li><strong>Art. 6 Abs. 1 lit. a DSGVO:</strong> Einwilligung des Nutzers bei der Registrierung.</li>
                    <li><strong>Art. 6 Abs. 1 lit. f DSGVO:</strong> Unser berechtigtes Interesse an der Präsentation eines technischen Portfolios als Softwareentwickler.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 border-b pb-2">5. Weitergabe von Daten (Dienste Dritter)</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                    Zur Bereitstellung der Funktionen nutzen wir:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed mb-4">
                    <li><strong>Hosting:</strong> Vercel Inc. (San Francisco, USA).</li>
                    <li><strong>Kartenmaterial:</strong> Tiles von CartoDB und Geocoding über Nominatim (OpenStreetMap). Hierbei werden IP-Adressen an die jeweiligen Server übertragen.</li>
                    <li><strong>Zahlungen:</strong> Es werden ausdrücklich <strong>keine Zahlungsdaten</strong> (Kreditkarten, Bankverbindungen) erfasst oder verarbeitet.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 border-b pb-2">6. Hinweis für Dienstleister (§ 18b AufenthG u.a.)</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                    Nutzer, die sich als Dienstleister registrieren, bestätigen mit der Nutzung, dass sie über die notwendigen rechtlichen Erlaubnisse zur Ausübung ihrer Tätigkeit in Deutschland verfügen. Die Plattform Svoi.de übernimmt keine Prüfung der Erwerbsberechtigung der Nutzer und stellt lediglich die technische Infrastruktur zur Demonstration bereit.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 border-b pb-2">7. Ihre Rechte (Auskunft, Löschung, Widerruf)</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                    Sie können jederzeit die Löschung Ihres Test-Accounts verlangen oder der Speicherung Ihrer Daten widersprechen. Kontaktieren Sie uns hierzu einfach per E-Mail.
                </p>
            </section>
        </div>
    );
}
