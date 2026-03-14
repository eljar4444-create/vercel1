# Prisma / Database

## Seed: «Can't reach database server»

При ошибке **Can't reach database server at `ep-....neon.tech:5432`** при запуске `npx prisma db seed` или `npm run seed`:

1. **Neon (бесплатный тариф) приостанавливает проект** при простое. Откройте [Neon Console](https://console.neon.tech), выберите проект — через несколько секунд БД снова станет доступна.
2. Сразу после этого в терминале выполните:
   ```bash
   npm run seed
   ```
   или
   ```bash
   npx prisma db seed
   ```

Переменные окружения берутся из `.env` в корне проекта. Убедитесь, что в `DATABASE_URL` указан нужный хост и пароль.
