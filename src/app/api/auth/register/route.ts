import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(['CLIENT', 'PROVIDER']),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = RegisterSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
        }

        const { email, password, name, role } = result.data;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
            },
        });

        return NextResponse.json({
            success: true,
            user: { id: user.id, email: user.email, role: user.role, name: user.name }
        });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
