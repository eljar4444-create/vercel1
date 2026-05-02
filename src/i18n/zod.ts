import { z, ZodIssueCode, type ZodErrorMap, type ZodIssueOptionalMessage } from 'zod';

import { DEFAULT_LOCALE, isLocale, type Locale } from './config';

type Primitive = string | number | bigint | boolean | null | undefined;
type FormatValues = Record<string, Primitive>;

function getMessage(messages: unknown, path: string): string | undefined {
    const value = path.split('.').reduce<unknown>((current, key) => {
        if (!current || typeof current !== 'object') return undefined;
        return (current as Record<string, unknown>)[key];
    }, messages);

    return typeof value === 'string' ? value : undefined;
}

function formatTemplate(template: string, values: FormatValues = {}) {
    return template.replace(/\{(\w+)\}/g, (_, key: string) => {
        const value = values[key];
        return value === null || value === undefined ? '' : String(value);
    });
}

function createTranslator(messages: unknown) {
    return (key: string, values?: FormatValues) => {
        const template =
            getMessage(messages, `validation.zod.${key}`) ??
            getMessage(messages, 'validation.zod.fallback') ??
            'Invalid input';

        return formatTemplate(template, values);
    };
}

function list(value: readonly unknown[] | undefined) {
    return value?.map(String).join(', ') ?? '';
}

function issueMessageKey(issue: ZodIssueOptionalMessage): {
    key: string;
    values?: FormatValues;
} {
    switch (issue.code) {
        case ZodIssueCode.invalid_type:
            if (issue.received === 'undefined') {
                return { key: 'required' };
            }
            return {
                key: 'invalidType',
                values: { expected: issue.expected, received: issue.received },
            };
        case ZodIssueCode.invalid_string:
            if (issue.validation === 'email') return { key: 'invalidEmail' };
            if (issue.validation === 'url') return { key: 'invalidUrl' };
            if (issue.validation === 'uuid') return { key: 'invalidUuid' };
            if (issue.validation === 'regex') return { key: 'invalidFormat' };
            return { key: 'invalidString' };
        case ZodIssueCode.too_small:
            if (issue.type === 'string') {
                return { key: 'tooSmallString', values: { minimum: issue.minimum } };
            }
            if (issue.type === 'number') {
                return { key: 'tooSmallNumber', values: { minimum: issue.minimum } };
            }
            if (issue.type === 'array') {
                return { key: 'tooSmallArray', values: { minimum: issue.minimum } };
            }
            return { key: 'tooSmall', values: { minimum: issue.minimum } };
        case ZodIssueCode.too_big:
            if (issue.type === 'string') {
                return { key: 'tooBigString', values: { maximum: issue.maximum } };
            }
            if (issue.type === 'number') {
                return { key: 'tooBigNumber', values: { maximum: issue.maximum } };
            }
            if (issue.type === 'array') {
                return { key: 'tooBigArray', values: { maximum: issue.maximum } };
            }
            return { key: 'tooBig', values: { maximum: issue.maximum } };
        case ZodIssueCode.invalid_enum_value:
            return { key: 'invalidEnum', values: { options: list(issue.options) } };
        case ZodIssueCode.unrecognized_keys:
            return { key: 'unrecognizedKeys', values: { keys: list(issue.keys) } };
        case ZodIssueCode.invalid_date:
            return { key: 'invalidDate' };
        case ZodIssueCode.invalid_union:
            return { key: 'invalidUnion' };
        case ZodIssueCode.invalid_literal:
            return { key: 'invalidLiteral', values: { expected: String(issue.expected) } };
        case ZodIssueCode.not_multiple_of:
            return { key: 'notMultipleOf', values: { multipleOf: issue.multipleOf } };
        case ZodIssueCode.custom:
            return { key: 'custom' };
        default:
            return { key: 'fallback' };
    }
}

export function createZodErrorMap(messages: unknown): ZodErrorMap {
    const t = createTranslator(messages);

    return (issue) => {
        const { key, values } = issueMessageKey(issue);
        return { message: t(key, values) };
    };
}

export async function getZodErrorMap(locale: Locale = DEFAULT_LOCALE): Promise<ZodErrorMap> {
    const messages = (await import(`./messages/${locale}.json`)).default;
    return createZodErrorMap(messages);
}

export function localeFromRequest(request: Request): Locale {
    const xLocale = request.headers.get('x-locale');
    if (isLocale(xLocale)) return xLocale;

    const accepted = request.headers.get('accept-language') ?? '';
    const tags = accepted
        .split(',')
        .map((tag) => tag.split(';')[0]?.trim().toLowerCase())
        .filter(Boolean);

    for (const tag of tags) {
        const primary = tag.split('-')[0];
        if (isLocale(primary)) return primary;
    }

    return DEFAULT_LOCALE;
}

export async function safeParseWithLocale<TSchema extends z.ZodTypeAny>(
    schema: TSchema,
    value: unknown,
    locale: Locale,
) {
    return schema.safeParse(value, {
        errorMap: await getZodErrorMap(locale),
    });
}
