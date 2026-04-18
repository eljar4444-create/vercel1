import withBundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
    serverActions: {
        bodySizeLimit: '6mb',
    },
    images: {
        formats: ['image/avif', 'image/webp'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: '*.public.blob.vercel-storage.com',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
        ],
    },
    async redirects() {
        return [
            {
                source: '/login',
                destination: '/auth/login',
                permanent: true,
            },
            {
                source: '/register',
                destination: '/auth/login',
                permanent: true,
            },
        ];
    },
};

const analyzer = withBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
});

export default analyzer(nextConfig);
