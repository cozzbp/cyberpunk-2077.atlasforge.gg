/** @type {import('next').NextConfig} */
const IS_DEV = process.env.NODE_ENV === 'development'
const nextConfig = {
  //output: 'export',
  assetPrefix: IS_DEV ? undefined : 'https://cyberpunk.atlasforge.gg',
  skipTrailingSlashRedirect: true,
  experimental: {
    externalDir: true,
  },
  reactStrictMode: true,
	swcMinify: true,
  trailingSlash: false,
  webpack: (config, { isServer }) => {
    if (!isServer) config.resolve.fallback.fs = false;
    return config;
  }
}

module.exports = nextConfig
