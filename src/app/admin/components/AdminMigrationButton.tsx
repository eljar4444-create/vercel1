"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { migrateOrphanedProviders } from "../actions";
import { DatabaseZap } from "lucide-react";
import { useTranslations } from "next-intl";

export function AdminMigrationButton() {
    const t = useTranslations("dashboard.admin.migration");
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null);

    const handleMigrate = () => {
        if (!window.confirm(t("confirm"))) {
            return;
        }

        startTransition(async () => {
            try {
                const res = await migrateOrphanedProviders();
                setResult(res);
                if (res.success) {
                    alert(t("success", { count: res.count ?? 0 }));
                }
            } catch (error: any) {
                console.error(error);
                setResult({ success: false, error: error.message });
                alert(t("error", { message: error.message }));
            }
        });
    };

    return (
        <div className="mb-8 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div>
                <h3 className="font-semibold text-blue-900">{t("title")}</h3>
                <p className="text-sm text-blue-700">{t("body")}</p>
            </div>
            <Button
                onClick={handleMigrate}
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700"
            >
                <DatabaseZap className="mr-2 h-4 w-4" />
                {isPending ? t("running") : t("button")}
            </Button>
        </div>
    );
}
