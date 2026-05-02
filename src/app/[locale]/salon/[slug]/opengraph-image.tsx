/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const revalidate = 3600;

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({ params }: { params: { locale: string; slug: string } }) {
    // ── Lightweight query — only the fields needed for the card ──
    const profile = await prisma.profile.findFirst({
        where: { slug: params.slug, status: 'PUBLISHED' },
        select: {
            id: true,
            name: true,
            city: true,
            image_url: true,
            category: { select: { name: true } },
        },
    });

    if (!profile) {
        return new ImageResponse(
            (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#1A1514',
                        color: '#fff',
                        fontSize: 48,
                        fontFamily: 'Inter, sans-serif',
                    }}
                >
                    SVOI.DE
                </div>
            ),
            { ...size }
        );
    }

    // ── Aggregate rating ──
    const reviewStats = await prisma.review.aggregate({
        where: { profileId: profile.id },
        _avg: { rating: true },
        _count: { id: true },
    });
    const averageRating = reviewStats._avg.rating
        ? Number(reviewStats._avg.rating.toFixed(1))
        : 0;
    const reviewCount = reviewStats._count.id || 0;

    // ── Build subtitle line ──
    const subtitleParts: string[] = [];
    if (profile.category?.name) subtitleParts.push(profile.category.name);
    if (profile.city) subtitleParts.push(profile.city);
    const subtitle = subtitleParts.join(' • ') || '';

    // ── Resolve avatar with fallback initials ──
    const avatarUrl = profile.image_url;
    const initials = profile.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: 'Inter, sans-serif',
                    position: 'relative',
                    overflow: 'hidden',
                    /* Dark premium base */
                    backgroundColor: '#1A1514',
                }}
            >
                {/* ── Subtle gradient overlay ── */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        background:
                            'radial-gradient(ellipse 80% 60% at 70% 40%, rgba(180,120,80,0.18) 0%, transparent 70%)',
                    }}
                />

                {/* ── Top-right branding ── */}
                <div
                    style={{
                        position: 'absolute',
                        top: 36,
                        right: 48,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <span
                        style={{
                            fontSize: 22,
                            fontWeight: 600,
                            letterSpacing: '0.12em',
                            color: 'rgba(255,255,255,0.45)',
                        }}
                    >
                        SVOI.DE
                    </span>
                </div>

                {/* ── Main content — centered card ── */}
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 80px',
                        gap: 56,
                    }}
                >
                    {/* ── Avatar ── */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 220,
                            height: 220,
                            borderRadius: '50%',
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: '4px solid rgba(255,255,255,0.12)',
                            background: avatarUrl
                                ? 'transparent'
                                : 'linear-gradient(135deg, #6B4C3B 0%, #8B6B52 100%)',
                        }}
                    >
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={profile.name}
                                width={220}
                                height={220}
                                style={{ objectFit: 'cover', width: 220, height: 220 }}
                            />
                        ) : (
                            <span
                                style={{
                                    fontSize: 72,
                                    fontWeight: 700,
                                    color: 'rgba(255,255,255,0.85)',
                                    display: 'flex',
                                }}
                            >
                                {initials}
                            </span>
                        )}
                    </div>

                    {/* ── Text block ── */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                            maxWidth: 680,
                        }}
                    >
                        {/* Name */}
                        <span
                            style={{
                                fontSize: 56,
                                fontWeight: 700,
                                color: '#FFFFFF',
                                lineHeight: 1.15,
                                letterSpacing: '-0.01em',
                            }}
                        >
                            {profile.name}
                        </span>

                        {/* Subtitle: category • city */}
                        {subtitle && (
                            <span
                                style={{
                                    fontSize: 26,
                                    color: 'rgba(255,255,255,0.55)',
                                    fontWeight: 400,
                                    letterSpacing: '0.02em',
                                    marginTop: 4,
                                    display: 'flex',
                                }}
                            >
                                {subtitle}
                            </span>
                        )}

                        {/* Rating */}
                        {averageRating > 0 && reviewCount > 0 && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    marginTop: 16,
                                }}
                            >
                                {/* Star icon (unicode) */}
                                <span
                                    style={{
                                        fontSize: 28,
                                        color: '#F5A623',
                                        display: 'flex',
                                    }}
                                >
                                    ★
                                </span>
                                <span
                                    style={{
                                        fontSize: 28,
                                        fontWeight: 600,
                                        color: '#F5A623',
                                        display: 'flex',
                                    }}
                                >
                                    {averageRating.toFixed(1)}
                                </span>
                                <span
                                    style={{
                                        fontSize: 22,
                                        color: 'rgba(255,255,255,0.35)',
                                        display: 'flex',
                                        marginLeft: 4,
                                    }}
                                >
                                    ({reviewCount}{' '}
                                    {reviewCount === 1 ? 'отзыв' : reviewCount < 5 ? 'отзыва' : 'отзывов'})
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Bottom accent line ── */}
                <div
                    style={{
                        width: '100%',
                        height: 4,
                        display: 'flex',
                        background:
                            'linear-gradient(90deg, transparent 0%, #B4784F 30%, #D4A574 50%, #B4784F 70%, transparent 100%)',
                    }}
                />
            </div>
        ),
        {
            ...size,
        }
    );
}
