import Link from 'next/link';

export default function HomepageFooter() {
    return (
        <footer className="bg-booking-bg py-10">
            <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
                <div className="flex flex-wrap justify-center gap-6 text-xs font-semibold text-booking-textMuted uppercase tracking-wider">
                    <Link href="/impressum" className="hover:text-booking-textMain transition-colors">Impressum</Link>
                    <Link href="/datenschutz" className="hover:text-booking-textMain transition-colors">Datenschutz</Link>
                    <Link href="/agb" className="hover:text-booking-textMain transition-colors">AGB</Link>
                </div>
            </div>
        </footer>
    );
}
