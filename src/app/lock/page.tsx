'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { verifyPassword } from './actions';

export default function LockPage() {
    const [error, setError] = useState('');

    async function handleSubmit(formData: FormData) {
        const result = await verifyPassword(formData);
        if (result?.error) {
            setError(result.error);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                <div className="mb-6">
                    <img src="/logo.png" alt="Svoi.de" className="h-16 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900">Доступ ограничен</h1>
                    <p className="text-gray-500 mt-2">Введите пароль для доступа к сайту</p>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    <Input
                        type="password"
                        name="password"
                        placeholder="Пароль"
                        className="text-center text-lg"
                        required
                    />
                    {error && <div className="text-red-500 text-sm">{error}</div>}
                    <Button type="submit" className="w-full bg-[#fc0] hover:bg-[#e6b800] text-black font-bold h-12 text-lg">
                        Войти
                    </Button>
                </form>

                <p className="mt-8 text-xs text-gray-400">
                    Svoi.de &copy; 2026
                </p>
            </div>
        </div>
    );
}
