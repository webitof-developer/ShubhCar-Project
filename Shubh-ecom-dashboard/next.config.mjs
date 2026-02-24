import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security: fail fast at startup if NextAuth secret is not configured.
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is not defined');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  sassOptions: {
    includePaths: [
      path.join(__dirname, 'node_modules').replace(/\\/g, '/'),
      path.join(__dirname, 'node_modules/bootstrap/scss').replace(/\\/g, '/'),
    ],
  },
};

export default nextConfig;
