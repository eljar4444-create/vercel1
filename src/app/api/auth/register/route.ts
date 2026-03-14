import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
});

export async function POST(req: NextRequest) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 16) {
        console.error('Registration: JWT_SECRET is missing or too short (min 16 chars)');
        return NextResponse.json(
            { error: 'Сервер не настроен для регистрации. Обратитесь к администратору.' },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();

        const result = RegisterSchema.safeParse(body);

        if (!result.success) {
            const firstIssue = result.error.flatten().fieldErrors;
            const message = firstIssue.email?.[0] ?? firstIssue.password?.[0] ?? firstIssue.name?.[0] ?? 'Проверьте введённые данные.';
            return NextResponse.json({ error: message }, { status: 400 });
        }

        const { email, password, name } = result.data;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json(
                { error: 'Пользователь с таким email уже зарегистрирован.' },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'USER',
            },
        });

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            jwtSecret,
            { expiresIn: '7d' }
        );

        return NextResponse.json({
            success: true,
            token,
            user: { id: user.id, email: user.email, role: user.role, name: user.name },
        });

    } catch (error: unknown) {
        console.error('Registration error:', error);

        // Prisma unique constraint (e.g. race: email taken between findUnique and create)
        const prismaError = error as { code?: string };
        if (prismaError.code === 'P2002') {
            return NextResponse.json(
                { error: 'Пользователь с таким email уже зарегистрирован.' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Ошибка при создании аккаунта. Попробуйте позже.' },
            { status: 500 }
        );
    }
}
