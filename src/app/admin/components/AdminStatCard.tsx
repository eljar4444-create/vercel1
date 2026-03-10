import { LucideIcon } from "lucide-react";

interface AdminStatCardProps {
    label: string;
    value: number | string;
    icon: LucideIcon;
    iconColor: string;
    iconBg: string;
    borderColor: string;
    trend?: string;
}

export default function AdminStatCard({
    label,
    value,
    icon: Icon,
    iconColor,
    iconBg,
    borderColor,
    trend,
}: AdminStatCardProps) {
    return (
        <div
            className={`relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
            style={{ borderLeft: `4px solid ${borderColor}` }}
        >
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `radial-gradient(circle at 80% 20%, ${borderColor} 0%, transparent 60%)`
                }}
            />

            <div className="relative flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">{value}</p>
                    {trend && (
                        <p className="mt-1 text-xs text-gray-500">{trend}</p>
                    )}
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
            </div>
        </div>
    );
}
