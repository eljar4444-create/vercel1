"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { migrateOrphanedProviders } from "../actions";
import { DatabaseZap } from "lucide-react";

export function AdminMigrationButton() {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null);

    const handleMigrate = () => {
        if (!window.confirm("Оживить тестовых мастеров? Это создаст новых User'ов для осиротевших профилей.")) {
            return;
        }

        startTransition(async () => {
            try {
                const res = await migrateOrphanedProviders();
                setResult(res);
                if (res.success) {
                    alert(`Миграция успешна! Оживлено профилей: ${res.count}`);
                }
            } catch (error: any) {
                console.error(error);
                setResult({ success: false, error: error.message });
                alert(`Ошибка миграции: ${error.message}`);
            }
        });
    };

    return (
        <div className="mb-8 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div>
                <h3 className="font-semibold text-blue-900">Инструменты разработчика</h3>
                <p className="text-sm text-blue-700">Оживить профили "призраков" без аккаунта. (Временная кнопка)</p>
            </div>
            <Button
                onClick={handleMigrate}
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700"
            >
                <DatabaseZap className="mr-2 h-4 w-4" />
                {isPending ? "Миграция..." : "Фикс БД: Оживить мастеров"}
            </Button>
        </div>
    );
}
