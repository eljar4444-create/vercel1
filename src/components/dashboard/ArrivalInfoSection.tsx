'use client';

import { useState } from 'react';
import { MapPin, Key, Bell, Coffee, Save, Loader2, Trash2, Eye } from 'lucide-react';
import { updateArrivalInfo } from '@/app/actions/portfolio-photos';
import toast from 'react-hot-toast';

type ArrivalInfoData = {
    address: string;
    doorCode?: string;
    bellNote?: string;
    waitingSpot?: string;
};

interface ArrivalInfoSectionProps {
    initialData: ArrivalInfoData | null;
}

export function ArrivalInfoSection({ initialData }: ArrivalInfoSectionProps) {
    const [address, setAddress] = useState(initialData?.address ?? '');
    const [doorCode, setDoorCode] = useState(initialData?.doorCode ?? '');
    const [bellNote, setBellNote] = useState(initialData?.bellNote ?? '');
    const [waitingSpot, setWaitingSpot] = useState(initialData?.waitingSpot ?? '');
    const [isSaving, setIsSaving] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    const hasData = address.trim().length > 0;
    const hasAnyValue = address.trim() || doorCode.trim() || bellNote.trim() || waitingSpot.trim();

    const handleSave = async () => {
        if (!address.trim()) {
            toast.error('Адрес обязателен.');
            return;
        }

        setIsSaving(true);
        try {
            const data: ArrivalInfoData = { address: address.trim() };
            if (doorCode.trim()) data.doorCode = doorCode.trim();
            if (bellNote.trim()) data.bellNote = bellNote.trim();
            if (waitingSpot.trim()) data.waitingSpot = waitingSpot.trim();

            const result = await updateArrivalInfo(data);
            if (result.success) {
                toast.success('Информация о прибытии сохранена');
            } else {
                toast.error(result.error || 'Ошибка сохранения');
            }
        } catch {
            toast.error('Ошибка сохранения');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClear = async () => {
        if (!window.confirm('Удалить информацию о прибытии?')) return;

        setIsClearing(true);
        try {
            const result = await updateArrivalInfo(null);
            if (result.success) {
                setAddress('');
                setDoorCode('');
                setBellNote('');
                setWaitingSpot('');
                toast.success('Информация о прибытии удалена');
            } else {
                toast.error(result.error || 'Ошибка удаления');
            }
        } catch {
            toast.error('Ошибка удаления');
        } finally {
            setIsClearing(false);
        }
    };

    const inputClass =
        'w-full h-10 px-3 bg-transparent border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors';
    const labelClass = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

    return (
        <div className="space-y-5">
            {/* Form Fields */}
            <div className="space-y-4">
                <div>
                    <label className={labelClass}>
                        <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3 w-3" />
                            Точный адрес <span className="text-red-400">*</span>
                        </span>
                    </label>
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Auguststraße 12, 10117 Berlin"
                        className={inputClass}
                        id="arrival-address"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                        Адрес виден клиенту только после подтверждения записи.
                    </p>
                </div>

                <div>
                    <label className={labelClass}>
                        <span className="inline-flex items-center gap-1.5">
                            <Key className="h-3 w-3" />
                            Код двери
                        </span>
                    </label>
                    <input
                        type="text"
                        value={doorCode}
                        onChange={(e) => setDoorCode(e.target.value)}
                        placeholder="4521#"
                        className={inputClass}
                        id="arrival-door-code"
                    />
                </div>

                <div>
                    <label className={labelClass}>
                        <span className="inline-flex items-center gap-1.5">
                            <Bell className="h-3 w-3" />
                            Звонок / домофон
                        </span>
                    </label>
                    <input
                        type="text"
                        value={bellNote}
                        onChange={(e) => setBellNote(e.target.value)}
                        placeholder="Звонок «Мария», 3 этаж"
                        className={inputClass}
                        id="arrival-bell-note"
                    />
                </div>

                <div>
                    <label className={labelClass}>
                        <span className="inline-flex items-center gap-1.5">
                            <Coffee className="h-3 w-3" />
                            Место ожидания
                        </span>
                    </label>
                    <input
                        type="text"
                        value={waitingSpot}
                        onChange={(e) => setWaitingSpot(e.target.value)}
                        placeholder="Café Oliv (2 мин) — отличное место подождать"
                        className={inputClass}
                        id="arrival-waiting-spot"
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || isClearing || !address.trim()}
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-gray-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                    id="arrival-save-btn"
                >
                    {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    Сохранить
                </button>

                {hasAnyValue && (
                    <button
                        type="button"
                        onClick={handleClear}
                        disabled={isSaving || isClearing}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-gray-300 bg-transparent px-4 text-sm font-medium text-gray-500 transition-colors hover:border-gray-900 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                        id="arrival-clear-btn"
                    >
                        {isClearing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                        Удалить
                    </button>
                )}
            </div>

            {/* Preview Card */}
            {hasData && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        <Eye className="h-3 w-3" />
                        Превью — так увидит клиент после записи
                    </div>
                    <div className="border-l-2 border-amber-300 bg-transparent pl-4 py-2">
                        <h4 className="mb-3 text-sm font-bold text-slate-800">Как добраться</h4>
                        <div className="space-y-2 text-sm text-slate-700">
                            <div className="flex items-start gap-2.5">
                                <span className="mt-0.5 text-base" role="img" aria-label="pin">📍</span>
                                <span>{address.trim()}</span>
                            </div>
                            {bellNote.trim() && (
                                <div className="flex items-start gap-2.5">
                                    <span className="mt-0.5 text-base" role="img" aria-label="bell">🔔</span>
                                    <span>{bellNote.trim()}</span>
                                </div>
                            )}
                            {doorCode.trim() && (
                                <div className="flex items-start gap-2.5">
                                    <span className="mt-0.5 text-base" role="img" aria-label="key">🔑</span>
                                    <span>Код двери: {doorCode.trim()}</span>
                                </div>
                            )}
                            {waitingSpot.trim() && (
                                <div className="flex items-start gap-2.5">
                                    <span className="mt-0.5 text-base" role="img" aria-label="coffee">☕</span>
                                    <span>Рядом: {waitingSpot.trim()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
