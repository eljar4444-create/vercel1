'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitLegalSetup } from '@/app/actions/legalSetup';
import { useSession } from 'next-auth/react';

type InitialData = {
    legalEntityType: string;
    legalName: string;
    taxId: string;
    vatId: string;
};

export function LegalSetupForm({ profileId, initialData }: { profileId: number, initialData: InitialData }) {
    const router = useRouter();
    const { update } = useSession();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [entityType, setEntityType] = useState(initialData.legalEntityType);
    const [data, setData] = useState({
        legalName: initialData.legalName,
        taxId: initialData.taxId,
        vatId: initialData.vatId
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('profileId', profileId.toString());
            formData.append('legalEntityType', entityType);
            formData.append('legalName', data.legalName);
            formData.append('taxId', data.taxId);
            formData.append('vatId', data.vatId);

            const result = await submitLegalSetup(formData);
            if (result.success) {
                // Refresh the JWT session cookie so Middleware learns about the completed state
                await update({ onboardingCompleted: true });
                window.location.href = '/dashboard';
            } else {
                setError(result.error || 'Ошибка при сохранении данных');
                setLoading(false);
            }
        } catch (e: any) {
            setError(e.message || 'Произошла непредвиденная ошибка');
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 text-black">
            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Тип лица</label>
                    <select 
                        value={entityType}
                        onChange={(e) => setEntityType(e.target.value)}
                        className="w-full border rounded-md p-2 bg-white"
                        required
                    >
                        <option value="individual">Физическое лицо / Самозанятый (Частный мастер)</option>
                        <option value="company">Юридическое лицо (Салон / GmbH / UG)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Полное юридическое имя (ФИО или название компании) *
                    </label>
                    <input 
                        type="text" 
                        value={data.legalName}
                        onChange={(e) => setData({ ...data, legalName: e.target.value })}
                        className="w-full border rounded-md p-2"
                        placeholder="Например: Ivan Ivanov или Beauty Salon GmbH"
                        required
                        minLength={3}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Идентификационный номер налогоплательщика (Steuer-ID / Steuernummer) *
                    </label>
                    <input 
                        type="text" 
                        value={data.taxId}
                        onChange={(e) => setData({ ...data, taxId: e.target.value })}
                        className="w-full border rounded-md p-2"
                        placeholder="Например: 11/222/33333 или 11 222 33333"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">Обязательно для всех, кто оказывает платные услуги.</p>
                </div>

                {entityType === 'company' && (
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            НДС номер (USt-IdNr)
                        </label>
                        <input 
                            type="text" 
                            value={data.vatId}
                            onChange={(e) => setData({ ...data, vatId: e.target.value })}
                            className="w-full border rounded-md p-2"
                            placeholder="DE123456789 (Если применимо)"
                        />
                    </div>
                )}
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded-md font-medium hover:bg-gray-800 disabled:opacity-50"
            >
                {loading ? 'Сохранение...' : 'Завершить регистрацию'}
            </button>
        </form>
    );
}
