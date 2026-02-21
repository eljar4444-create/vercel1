export const SERVICE_TREE = {
    beauty: {
        'Волосы': [
            'Стрижка (Женская/Мужская)',
            'Окрашивание (Сложное/В один тон)',
            'Наращивание волос (Капсульное, Ленточное, Голливудское)',
            'Уход (Кератин, Ботокс)',
            'Укладка/Прическа',
        ],
        'Ногти': [
            'Маникюр (Аппаратный/Пилочный)',
            'Педикюр (SMART/Медицинский)',
            'Наращивание ногтей',
            'Покрытие (Гель-лак/Френч)',
        ],
        'Брови и Ресницы': [
            'Наращивание ресниц (Классика/Объемы)',
            'Ламинирование',
            'Оформление бровей',
        ],
        'Косметология': ['Чистка лица', 'Пилинги', 'Массаж лица', 'Макияж'],
        'Эпиляция и Массаж': [
            'Массаж (Классический/Антицеллюлитный)',
            'Шугаринг/Воск',
            'Лазерная эпиляция',
        ],
    },
} as const;

export type ServiceTreeKey = keyof typeof SERVICE_TREE;

export function resolveServiceTreeKey(input?: string | null): ServiceTreeKey | null {
    if (!input) return 'beauty';
    const normalized = input.trim().toLowerCase();

    if (normalized === 'beauty' || normalized === 'красота') return 'beauty';
    return 'beauty';
}
