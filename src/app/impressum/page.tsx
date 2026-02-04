import React from 'react';

export default function ImpressumPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl font-sans text-slate-900">
            <h1 className="text-3xl font-bold mb-8">Impressum</h1>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">Angaben gemäß § 5 TMG</h2>
                <p className="text-gray-700 leading-relaxed mb-2">Eliar Mamedov</p>
                <p className="text-gray-700 leading-relaxed mb-2">Sophienstr. 22</p>
                <p className="text-gray-700 leading-relaxed mb-2">95444 Bayreuth</p>
                <p className="text-gray-700 leading-relaxed">Deutschland</p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">Kontakt</h2>
                <p className="text-gray-700 leading-relaxed mb-2">
                    <span className="font-semibold w-24 inline-block">Telefon:</span>
                    <a href="tel:+491722707002" className="hover:text-blue-600 transition-colors">+49 172 2707002</a>
                </p>
                <p className="text-gray-700 leading-relaxed">
                    <span className="font-semibold w-24 inline-block">E-Mail:</span>
                    <a href="mailto:eliar.mamedov@outlook.com" className="hover:text-blue-600 transition-colors">eliar.mamedov@outlook.com</a>
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">Haftungsausschluss (Disclaimer)</h2>

                <h3 className="text-lg font-bold mb-2">Haftung für Inhalte</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                    Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
                </p>

                <h3 className="text-lg font-bold mb-2">Haftung für Links</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                    Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
                </p>

                <h3 className="text-lg font-bold mb-2">Urheberrecht</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                    Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">Streitbeilegung</h2>
                <p className="text-gray-700 leading-relaxed">
                    Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://ec.europa.eu/consumers/odr</a>.<br />
                    Unsere E-Mail-Adresse finden Sie oben im Impressum.<br />
                    Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                </p>
            </section>
        </div>
    );
}
