'use client';

import { User, Phone, Mail, FileText } from 'lucide-react';

export function UserForm({
    name,
    setName,
    phone,
    setPhone,
    email,
    setEmail,
    comment,
    setComment
}: {
    name: string; setName: (v: string) => void;
    phone: string; setPhone: (v: string) => void;
    email: string; setEmail: (v: string) => void;
    comment: string; setComment: (v: string) => void;
}) {
    return (
        <section className="mb-10 lg:mb-0 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <h2 className="font-serif text-2xl text-booking-textMain flex items-center gap-2 mb-6">
                <span className="text-booking-textMuted tracking-tight text-xl translate-y-[2px]">👤</span> 
                Ваши данные
            </h2>
            <div className="bg-booking-card rounded-[2rem] p-6 sm:p-8 shadow-soft-out border border-white/50 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-booking-textMain ml-2">Имя</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Александра"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full h-14 bg-[#F2EFE8] rounded-2xl pl-5 pr-12 text-[15px] shadow-soft-in border outline-none border-transparent focus:border-[#D9D2C7] transition-all placeholder:text-booking-textMuted text-booking-textMain"
                            />
                            <User className="absolute right-4 top-[14px] w-6 h-6 text-[#9A9188]" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-booking-textMain ml-2">Телефон</label>
                        <div className="relative">
                            <input
                                type="tel"
                                placeholder="+49 (999) 000-00-00"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full h-14 bg-white rounded-2xl pl-5 pr-12 text-[15px] shadow-soft-in border outline-none border-transparent focus:border-[#D9D2C7] transition-all placeholder:text-booking-textMuted text-booking-textMain"
                            />
                            <Phone className="absolute right-4 top-[14px] w-6 h-6 text-[#9A9188]" />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-booking-textMain ml-2">Email</label>
                    <div className="relative">
                        <input
                            type="email"
                            placeholder="alexandra@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full h-14 bg-white rounded-2xl pl-5 pr-12 text-[15px] shadow-soft-in border outline-none border-transparent focus:border-[#D9D2C7] transition-all placeholder:text-booking-textMuted text-booking-textMain"
                        />
                        <Mail className="absolute right-4 top-[14px] w-6 h-6 text-[#9A9188]" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-booking-textMain ml-2">Комментарий для мастера (необязательно)</label>
                    <div className="relative">
                        <textarea
                            placeholder="Пожелания или особенности..."
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            className="w-full min-h-[120px] bg-white rounded-2xl p-5 pr-12 text-[15px] shadow-soft-in border outline-none border-transparent focus:border-[#D9D2C7] transition-all placeholder:text-booking-textMuted text-booking-textMain resize-vertical"
                        />
                        <FileText className="absolute right-4 top-5 w-6 h-6 text-[#9A9188]" />
                    </div>
                </div>

            </div>
        </section>
    );
}
