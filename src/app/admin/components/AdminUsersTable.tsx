"use client";

import { useTransition, useState, useEffect } from "react";
import { toggleUserBan, getUserBookings, approveMaster, rejectMaster } from "../actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ShieldAlert, ShieldCheck, Mail, Calendar,
    User as UserIcon, ChevronRight, Star, Briefcase, BookOpen,
    Ban, CircleCheckBig, ExternalLink, RefreshCw, Clock, DollarSign
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { useLocale, useTranslations } from "next-intl";

type AugmentedUser = any;

const APPROVED_PROVIDER_STATUSES = new Set(["PUBLISHED", "ACTIVE"]);
const REJECTED_PROVIDER_STATUSES = new Set(["SUSPENDED", "REJECTED"]);

function isApprovedProviderStatus(status?: string | null) {
    return !!status && APPROVED_PROVIDER_STATUSES.has(status);
}

function isRejectedProviderStatus(status?: string | null) {
    return !!status && REJECTED_PROVIDER_STATUSES.has(status);
}

function getInitials(name: string | null | undefined): string {
    if (!name) return "?";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function AvatarCell({ user }: { user: AugmentedUser }) {
    const t = useTranslations("dashboard.admin.usersTable");

    return (
        <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border border-gray-200">
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
                <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-900 text-white text-xs font-bold">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <span className="font-medium text-gray-900">{user.name || t("unnamed")}</span>
        </div>
    );
}

function RoleBadge({ role }: { role: string }) {
    const isAdmin = role === "ADMIN";
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide border ${isAdmin
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
        >
            {role}
        </span>
    );
}

function StatusBadge({ isBanned }: { isBanned: boolean }) {
    const t = useTranslations("dashboard.admin.usersTable");

    return isBanned ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-600 border border-red-200">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {t("status.banned")}
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t("status.active")}
        </span>
    );
}

function ProviderModerationBadge({ status }: { status?: string | null }) {
    const t = useTranslations("dashboard.admin.usersTable");
    if (!status) return null;

    const map: Record<string, { label: string; classes: string }> = {
        DRAFT: { label: t("providerStatus.draft"), classes: "border-stone-200 bg-stone-50 text-stone-700" },
        PENDING: { label: t("providerStatus.pending"), classes: "border-indigo-200 bg-indigo-50 text-indigo-700" },
        PENDING_REVIEW: { label: t("providerStatus.pending"), classes: "border-indigo-200 bg-indigo-50 text-indigo-700" },
        ACTIVE: { label: t("providerStatus.approved"), classes: "border-emerald-200 bg-emerald-50 text-emerald-700" },
        PUBLISHED: { label: t("providerStatus.approved"), classes: "border-emerald-200 bg-emerald-50 text-emerald-700" },
        REJECTED: { label: t("providerStatus.rejected"), classes: "border-rose-200 bg-rose-50 text-rose-700" },
        SUSPENDED: { label: t("providerStatus.rejected"), classes: "border-rose-200 bg-rose-50 text-rose-700" },
    };

    const config = map[status] ?? { label: status, classes: "border-gray-200 bg-gray-50 text-gray-700" };

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${config.classes}`}>
            {config.label}
        </span>
    );
}

/* ── User Dossier Panel ───────────────────────────────────────── */
function UserDossier({
    user,
    isPending,
    onToggleBan,
    onApproveProvider,
    onRejectProvider,
}: {
    user: AugmentedUser;
    isPending: boolean;
    onToggleBan: () => void;
    onApproveProvider: () => void;
    onRejectProvider: () => void;
}) {
    const t = useTranslations("dashboard.admin.usersTable");
    const locale = useLocale();
    const isAdmin = user.role === "ADMIN";
    const hasMasterProfile = !!user.profile;
    const regDate = user.createdAt
        ? new Intl.DateTimeFormat(locale, {
            day: "2-digit",
            month: "long",
            year: "numeric",
        }).format(new Date(user.createdAt))
        : "—";

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            {/* ── Gradient Profile Header ── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-6 pt-8 pb-6 shrink-0">
                {/* subtle radial glow */}
                <div className="absolute inset-0 opacity-20"
                    style={{
                        background: isAdmin
                            ? "radial-gradient(circle at 80% 20%, #9333ea 0%, transparent 60%)"
                            : "radial-gradient(circle at 80% 20%, #2563eb 0%, transparent 60%)"
                    }}
                />
                <div className="relative flex items-start gap-4">
                    {/* Large Avatar */}
                    <div className={`relative shrink-0 rounded-full p-0.5 ${isAdmin
                        ? "bg-gradient-to-br from-purple-400 to-purple-700"
                        : "bg-gradient-to-br from-blue-400 to-blue-700"
                        }`}>
                        <Avatar className="h-16 w-16 border-2 border-gray-900">
                            <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
                            <AvatarFallback className="bg-gray-800 text-white text-xl font-bold">
                                {getInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                        <h3 className="text-lg font-bold text-white leading-tight truncate">
                            {user.name || t("unnamed")}
                        </h3>
                        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-300">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span className="truncate text-xs">{user.email || t("noEmail")}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>{t("registered", { date: regDate })}</span>
                        </div>
                    </div>
                </div>

                {/* Role + Status pills */}
                <div className="relative mt-5 flex gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${isAdmin
                        ? "border-purple-500/40 bg-purple-500/20 text-purple-300"
                        : "border-blue-500/40 bg-blue-500/20 text-blue-300"
                        }`}>
                        {isAdmin ? <ShieldCheck className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                        {user.role}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${user.isBanned
                        ? "border-red-500/40 bg-red-500/20 text-red-300"
                        : "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                        }`}>
                        {user.isBanned
                            ? <><Ban className="h-3 w-3" /> {t("status.banned")}</>
                            : <><CircleCheckBig className="h-3 w-3" /> Active</>
                        }
                    </span>
                </div>

                {hasMasterProfile && (
                    <div className="relative mt-4">
                        <Button
                            asChild
                            variant="secondary"
                            size="sm"
                            className="w-full bg-white/10 hover:bg-white/20 text-white border-white/10 font-medium"
                        >
                            <Link href={`/salon/${user.profile.slug || user.profile.id}`} target="_blank">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                {t("openPublicProfile")}
                            </Link>
                        </Button>
                    </div>
                )}
            </div>

            {/* ── Body ── */}
            <div className="flex-1 overflow-hidden flex flex-col pt-3">
                <Tabs defaultValue="stats" className="w-full flex-1 flex flex-col">
                    <div className="px-5 border-b border-gray-100 pb-0">
                        <TabsList className="bg-transparent h-auto p-0 gap-4 mb-0">
                            <TabsTrigger
                                value="stats"
                                className="rounded-none border-b-2 border-transparent px-2 pb-3 pt-1 text-xs font-semibold uppercase tracking-wider text-gray-400 data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 data-[state=active]:shadow-none bg-transparent"
                            >
                                {t("tabs.stats")}
                            </TabsTrigger>
                            <TabsTrigger
                                value="bookings"
                                className="rounded-none border-b-2 border-transparent px-2 pb-3 pt-1 text-xs font-semibold uppercase tracking-wider text-gray-400 data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 data-[state=active]:shadow-none bg-transparent"
                            >
                                {t("tabs.bookings")}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 pb-8">
                        <TabsContent value="stats" className="mt-0 space-y-5">
                            {/* Client Stats */}
                            <div>
                                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    {t("clientStats")}
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <StatTile
                                        value={user._count?.bookings ?? 0}
                                        label={t("bookingsCreated")}
                                        color="text-blue-600"
                                        bg="bg-blue-50"
                                        icon={BookOpen}
                                    />
                                    <StatTile
                                        value={hasMasterProfile ? t("yes") : t("no")}
                                        label={t("providerProfile")}
                                        color={hasMasterProfile ? "text-indigo-600" : "text-gray-400"}
                                        bg={hasMasterProfile ? "bg-indigo-50" : "bg-gray-50"}
                                        icon={Star}
                                    />
                                </div>
                            </div>

                            <div className="h-px bg-gray-100" />

                            {/* Master Stats */}
                            {hasMasterProfile ? (
                                <div>
                                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        {t("providerStats")}
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <StatTile
                                            value={user.profile._count?.services ?? 0}
                                            label={t("activeServices")}
                                            color="text-amber-600"
                                            bg="bg-amber-50"
                                            icon={Briefcase}
                                        />
                                        <StatTile
                                            value={user.profile._count?.bookings ?? 0}
                                            label={t("receivedBookings")}
                                            color="text-emerald-600"
                                            bg="bg-emerald-50"
                                            icon={BookOpen}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        {t("providerStats")}
                                    </p>
                                    <p className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-400 text-center italic">
                                        {t("noProviderProfile")}
                                    </p>
                                </div>
                            )}

                            <div className="h-px bg-gray-100" />

                            {/* Admin Actions */}
                            <div>
                                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    {t("adminActions")}
                                </p>

                                {hasMasterProfile && (
                                    <div className="mb-4 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <p className="text-xs font-semibold text-gray-900">{t("providerModeration")}</p>
                                            <ProviderModerationBadge status={user.profile.status} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                onClick={onApproveProvider}
                                                disabled={isPending || isApprovedProviderStatus(user.profile.status)}
                                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                            >
                                                {t("approve")}
                                            </Button>
                                            <Button
                                                onClick={onRejectProvider}
                                                disabled={isPending || isRejectedProviderStatus(user.profile.status)}
                                                variant="outline"
                                                className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                                            >
                                                {t("reject")}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {isAdmin ? (
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-center">
                                        <ShieldCheck className="mx-auto mb-1.5 h-5 w-5 text-gray-400" />
                                        <p className="text-xs text-gray-500">
                                            {t("cannotBanAdmins")}
                                        </p>
                                    </div>
                                ) : user.isBanned ? (
                                    <Button
                                        onClick={onToggleBan}
                                        disabled={isPending}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2"
                                    >
                                        <ShieldCheck className="h-4 w-4" />
                                        {t("unbanAccount")}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={onToggleBan}
                                        disabled={isPending}
                                        variant="outline"
                                        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 font-semibold gap-2"
                                    >
                                        <ShieldAlert className="h-4 w-4" />
                                        {t("softBan")}
                                    </Button>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="bookings" className="mt-0">
                            <UserBookingsList userId={user.id} userName={user.name} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}

function StatTile({
    value,
    label,
    color,
    bg,
    icon: Icon,
}: {
    value: number | string;
    label: string;
    color: string;
    bg: string;
    icon: any;
}) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-3.5 text-center shadow-sm">
            <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
            <p className="mt-0.5 text-[11px] text-gray-500 leading-tight">{label}</p>
        </div>
    );
}

function AdminStatusBadge({ status }: { status: string }) {
    const t = useTranslations("dashboard.admin.usersTable");
    const statusMap: Record<string, { label: string; classes: string }> = {
        pending: { label: t("bookingStatus.pending"), classes: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
        confirmed: { label: t("bookingStatus.confirmed"), classes: "bg-blue-50 text-blue-700 border border-blue-200" },
        completed: { label: t("bookingStatus.completed"), classes: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
        canceled: { label: t("bookingStatus.cancelled"), classes: "bg-red-50 text-red-700 border border-red-200" },
    };

    const config = statusMap[status] || { label: status, classes: "bg-gray-50 text-gray-700 border border-gray-200" };

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${config.classes}`}>
            {config.label}
        </span>
    );
}

function UserBookingsList({ userId, userName }: { userId: string, userName: string | null }) {
    const t = useTranslations("dashboard.admin.usersTable");
    const locale = useLocale();
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);
        getUserBookings(userId)
            .then((data) => {
                if (isMounted) {
                    setBookings(data || []);
                    setIsLoading(false);
                }
            })
            .catch((err) => {
                console.error("Failed to load user bookings:", err);
                if (isMounted) setIsLoading(false);
            });
        return () => {
            isMounted = false;
        };
    }, [userId]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-10">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">{t("loadingBookings")}</p>
            </div>
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 px-4 text-center">
                <BookOpen className="h-8 w-8 text-gray-300" />
                <h3 className="mt-3 text-sm font-medium text-gray-900">{t("noBookingsTitle")}</h3>
                <p className="mt-1 text-xs text-gray-500">
                    {t("noBookingsBody")}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {t("latestBookings", { count: bookings.length })}
            </p>
            {bookings.map((booking) => {
                const isProvider = booking.profile?.user_id === userId;
                const roleText = isProvider ? t("bookingFor") : t("bookingWith");
                const otherPersonName = isProvider
                    ? (booking.user_name || booking.user?.name || t("unnamed"))
                    : (booking.profile?.name || t("unnamed"));
                const otherPersonAvatar = isProvider
                    ? booking.user?.image
                    : (booking.profile?.image_url || booking.profile?.user?.image);

                return (
                    <div key={booking.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8 border border-gray-200 shrink-0">
                                    <AvatarImage src={otherPersonAvatar} />
                                    <AvatarFallback className="bg-gray-100 text-gray-600 text-[10px] font-bold">
                                        {getInitials(otherPersonName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 leading-none">
                                        {booking.service?.title || t("serviceDeleted")}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        <span className="font-medium text-gray-400 text-[10px] mr-1">{roleText}</span>
                                        {otherPersonName}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <AdminStatusBadge status={booking.status} />
                            </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-gray-400" />
                                    {new Intl.DateTimeFormat(locale, {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    }).format(new Date(booking.date))}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-gray-400" />
                                    {booking.time}
                                </div>
                            </div>
                            {booking.service?.price && (
                                <div className="flex items-center text-xs font-semibold text-gray-900">
                                    {Number(booking.service.price)}
                                    <DollarSign className="ml-0.5 h-3 w-3 text-gray-400" />
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ── Main Component ───────────────────────────────────────────── */
export default function AdminUsersTable({ users }: { users: AugmentedUser[] }) {
    const t = useTranslations("dashboard.admin.usersTable");
    const [isPending, startTransition] = useTransition();
    const [selectedUser, setSelectedUser] = useState<AugmentedUser | null>(null);
    const [userFilter, setUserFilter] = useState<"all" | "masters" | "clients">("all");
    const router = useRouter();

    const filteredUsers = users.filter((user) => {
        if (userFilter === "masters") return !!user.profile;
        if (userFilter === "clients") return !user.profile;
        return true;
    });

    const handleToggleBan = (userId: string, currentStatus: boolean) => {
        if (!currentStatus && !window.confirm(t("confirmBan"))) {
            return;
        }
        startTransition(async () => {
            await toggleUserBan(userId, currentStatus);
            router.refresh();
        });
    };

    const syncSelectedUserModeration = (profileId: number, status: string) => {
        setSelectedUser((current: AugmentedUser | null) => {
            if (!current?.profile || current.profile.id !== profileId) {
                return current;
            }

            return {
                ...current,
                profile: {
                    ...current.profile,
                    status,
                    is_verified: isApprovedProviderStatus(status),
                },
            };
        });
    };

    const handleApproveProvider = (profileId: number) => {
        startTransition(async () => {
            const formData = new FormData();
            formData.set("profile_id", String(profileId));
            const result = await approveMaster(formData);
            if (result?.status) {
                syncSelectedUserModeration(profileId, result.status);
            }
            router.refresh();
        });
    };

    const handleRejectProvider = (profileId: number) => {
        if (!window.confirm(t("confirmReject"))) {
            return;
        }

        startTransition(async () => {
            const formData = new FormData();
            formData.set("profile_id", String(profileId));
            const result = await rejectMaster(formData);
            if (result?.status) {
                syncSelectedUserModeration(profileId, result.status);
            }
            router.refresh();
        });
    };

    return (
        <>
            <div className="mb-4 flex flex-wrap gap-2">
                <Button
                    variant={userFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUserFilter("all")}
                    className="rounded-full h-8 text-xs font-medium"
                >
                    {t("filters.all")}
                </Button>
                <Button
                    variant={userFilter === "masters" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUserFilter("masters")}
                    className="rounded-full h-8 text-xs font-medium"
                >
                    {t("filters.masters")}
                </Button>
                <Button
                    variant={userFilter === "clients" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUserFilter("clients")}
                    className="rounded-full h-8 text-xs font-medium"
                >
                    {t("filters.clients")}
                </Button>
            </div>

            <div className="overflow-x-auto rounded-xl">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-100">
                            <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                                {t("columns.name")}
                            </TableHead>
                            <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                                Email
                            </TableHead>
                            <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                                {t("columns.accountType")}
                            </TableHead>
                            <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                                {t("columns.role")}
                            </TableHead>
                            <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                                {t("columns.status")}
                            </TableHead>
                            <TableHead className="py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400">
                                {t("columns.actions")}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-12 text-center text-gray-400">
                                    <UserIcon className="mx-auto mb-2 h-8 w-8 text-gray-200" />
                                    {t("emptyUsers")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow
                                    key={user.id}
                                    className="group cursor-pointer border-b border-gray-50 transition-colors hover:bg-blue-50/40"
                                    onClick={() => setSelectedUser(user)}
                                >
                                    <TableCell className="py-3.5">
                                        <AvatarCell user={user} />
                                    </TableCell>
                                    <TableCell className="py-3.5">
                                        <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-[11px] text-gray-600">
                                            {user.email || "—"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3.5">
                                        {user.profile ? (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-flex items-center rounded-sm bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                                                    {t("accountType.provider")}
                                                </span>
                                                <ProviderModerationBadge status={user.profile.status} />
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center rounded-sm bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                {t("accountType.client")}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-3.5">
                                        <RoleBadge role={user.role} />
                                    </TableCell>
                                    <TableCell className="py-3.5">
                                        <StatusBadge isBanned={user.isBanned} />
                                    </TableCell>
                                    <TableCell className="py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {user.profile && (
                                                <>
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleApproveProvider(user.profile.id);
                                                        }}
                                                        disabled={isPending || isApprovedProviderStatus(user.profile.status)}
                                                        size="sm"
                                                        className="bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                                                    >
                                                        {t("approve")}
                                                    </Button>
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRejectProvider(user.profile.id);
                                                        }}
                                                        disabled={isPending || isRejectedProviderStatus(user.profile.status)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-rose-200 text-xs text-rose-700 hover:border-rose-300 hover:bg-rose-50"
                                                    >
                                                        {t("reject")}
                                                    </Button>
                                                </>
                                            )}
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleBan(user.id, user.isBanned);
                                                }}
                                                disabled={isPending || user.role === "ADMIN"}
                                                variant="outline"
                                                size="sm"
                                                className={`text-xs ${user.isBanned
                                                    ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                                    : user.role === "ADMIN"
                                                        ? "cursor-not-allowed opacity-40"
                                                        : "border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                                                    }`}
                                            >
                                                {user.isBanned ? t("unban") : t("ban")}
                                            </Button>
                                            <ChevronRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* ── Dossier Sheet ── */}
            <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <SheetContent
                    className="w-full sm:max-w-[400px] p-0 overflow-hidden flex flex-col bg-white border-l border-gray-200 z-[100]"
                    side="right"
                >
                    {/* Visually hidden SheetHeader for accessibility */}
                    <SheetHeader className="sr-only">
                        <SheetTitle>{t("dossierTitle")}</SheetTitle>
                        <SheetDescription>
                            {t("dossierDescription")}
                        </SheetDescription>
                    </SheetHeader>

                    {selectedUser && (
                        <UserDossier
                            user={selectedUser}
                            isPending={isPending}
                            onToggleBan={() => handleToggleBan(selectedUser.id, selectedUser.isBanned)}
                            onApproveProvider={() => selectedUser.profile && handleApproveProvider(selectedUser.profile.id)}
                            onRejectProvider={() => selectedUser.profile && handleRejectProvider(selectedUser.profile.id)}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
