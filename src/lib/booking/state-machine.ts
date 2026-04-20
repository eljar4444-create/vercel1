import { BookingStatus, BookingCanceledBy } from '@prisma/client';

export type BookingActor = 'CLIENT' | 'MASTER' | 'SYSTEM';

export const TERMINAL_STATUSES: ReadonlySet<BookingStatus> = new Set([
    BookingStatus.COMPLETED,
    BookingStatus.CANCELED,
    BookingStatus.NO_SHOW,
]);

export function isTerminal(status: BookingStatus): boolean {
    return TERMINAL_STATUSES.has(status);
}

type TransitionRule = {
    to: BookingStatus;
    allowedActors: ReadonlyArray<BookingActor>;
};

const TRANSITIONS: Record<BookingStatus, ReadonlyArray<TransitionRule>> = {
    [BookingStatus.PENDING]: [
        { to: BookingStatus.CONFIRMED, allowedActors: ['MASTER'] },
        { to: BookingStatus.CANCELED, allowedActors: ['CLIENT', 'MASTER', 'SYSTEM'] },
    ],
    [BookingStatus.CONFIRMED]: [
        { to: BookingStatus.COMPLETED, allowedActors: ['MASTER', 'SYSTEM'] },
        { to: BookingStatus.NO_SHOW, allowedActors: ['MASTER', 'SYSTEM'] },
        { to: BookingStatus.CANCELED, allowedActors: ['CLIENT', 'MASTER', 'SYSTEM'] },
    ],
    [BookingStatus.CANCELED]: [],
    [BookingStatus.COMPLETED]: [],
    [BookingStatus.NO_SHOW]: [],
};

export function canTransition(
    from: BookingStatus,
    to: BookingStatus,
    actor: BookingActor,
): boolean {
    const rules = TRANSITIONS[from];
    const match = rules.find((r) => r.to === to);
    if (!match) return false;
    return match.allowedActors.includes(actor);
}

export function getAvailableActions(
    status: BookingStatus,
    actor: BookingActor,
): BookingStatus[] {
    return TRANSITIONS[status]
        .filter((rule) => rule.allowedActors.includes(actor))
        .map((rule) => rule.to);
}

export function actorToCanceledBy(actor: BookingActor): BookingCanceledBy {
    return actor;
}

export const STATUS_LABELS_RU: Record<BookingStatus, string> = {
    [BookingStatus.PENDING]: 'Ожидает',
    [BookingStatus.CONFIRMED]: 'Подтверждена',
    [BookingStatus.CANCELED]: 'Отменена',
    [BookingStatus.COMPLETED]: 'Завершена',
    [BookingStatus.NO_SHOW]: 'Не пришёл',
};
