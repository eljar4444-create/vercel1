import Link from 'next/link';

export default function HomepageFooter() {
    return (
        <footer className="bg-slate-950 py-8">
            <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
                <div className="flex justify-center gap-6 text-xs text-white/50">
                    <Link href="/impressum" className="hover:text-white/70 transition-colors">Правовая информация</Link>
                    <Link href="/datenschutz" className="hover:text-white/70 transition-colors">Политика конфиденциальности</Link>
                    <a href="https://instagram.com/svoi.de" target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition-colors">Instagram</a>
                </div>
                <p className="font-didot italic tracking-widest text-xs md:text-sm text-white/30 mt-4">
                    Designed in Europe. Built for our standards.
                </p>
            </div>
        </footer>
    );
}
