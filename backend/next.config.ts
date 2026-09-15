import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  agentRules: false,
  /* Ships .next/standalone: server.js plus only the node_modules the server
     bundle actually reaches (74 MB, against 693 MB installed). The Docker
     runner stage copies that and nothing else.

     Note what standalone does NOT carry: payload's CLI, tsx, and drizzle-kit.
     Migrations therefore run from a separate stage — see backend/Dockerfile. */
  output: 'standalone',

  /* Pins the file-tracing root to backend/, and it is load-bearing on a host
     build. This repo holds two npm projects: the Vite site at the repo root
     and this one. With no pin, Next picks the ROOT package-lock.json as the
     workspace root and emits .next/standalone/backend/server.js instead of
     .next/standalone/server.js — a path the Dockerfile does not expect.
     `turbopack.root` below already does this for Turbopack (Next 16's default
     builder); this covers a `next build --webpack` run too. */
  outputFileTracingRoot: path.resolve(dirname),

  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
