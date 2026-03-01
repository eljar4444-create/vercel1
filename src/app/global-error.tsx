'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="ru">
            <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f5f0e8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', padding: 24, maxWidth: 420 }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
                        Что-то пошло не так
                    </h1>
                    <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
                        Ошибка сервера. Проверьте терминал (npm run dev) для деталей. Убедитесь, что база данных доступна (DATABASE_URL в .env).
                    </p>
                    <button
                        type="button"
                        onClick={() => reset()}
                        style={{
                            padding: '10px 20px',
                            fontSize: 14,
                            fontWeight: 500,
                            color: '#fff',
                            background: '#0f172a',
                            border: 'none',
                            borderRadius: 12,
                            cursor: 'pointer',
                        }}
                    >
                        Попробовать снова
                    </button>
                </div>
            </body>
        </html>
    );
}
