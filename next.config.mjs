/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@farcaster/mini-app-solana': false,
    };
    config.externals.push({
      '@farcaster/mini-app-solana': 'commonjs @farcaster/mini-app-solana',
    });
    return config;
  },
};

export default nextConfig;
