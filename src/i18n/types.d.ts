import type messages from './messages/ru.json';

declare global {
    interface IntlMessages extends Messages {}
}

type Messages = typeof messages;

export {};
