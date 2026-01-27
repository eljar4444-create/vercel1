import Image from 'next/image';

export const Logo = () => {
    return (
        <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
                <Image
                    src="/logo-icon.png"
                    alt="Logo"
                    fill
                    className="object-contain"
                />
            </div>
            <div className="flex flex-col">
                <span className="text-xl font-bold leading-none text-[#0F172A]">Свои люди</span>
                <span className="text-sm font-light leading-none text-[#64748B] mt-1">Свой сервис</span>
            </div>
        </div>
    );
};
