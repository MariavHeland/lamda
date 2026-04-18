import type { NextConfig } from 'next';
import { loadEnvConfig } from '@next/env';
import path from 'path';

// Explicitly load .env.local from this project directory.
// Prevents Turbopack from loading env from a parent workspace root if
// node_modules exists in a parent directory.
loadEnvConfig(path.resolve(__dirname));

const nextConfig: NextConfig = {};

export default nextConfig;
