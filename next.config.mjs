/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',       // ← obrigatório para o Dockerfile acima
  reactStrictMode: true,
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
  ],
}

module.exports = nextConfig
