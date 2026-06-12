import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  // Trace from the monorepo root so workspace packages are bundled into the standalone output
  // (and to ignore unrelated lockfiles elsewhere on the machine).
  outputFileTracingRoot: path.join(dirname, "../.."),
  // Workspace packages are shipped as TypeScript and transpiled by Next.
  transpilePackages: ["@audova/shared"],
  typedRoutes: true,
  // Linting is run separately (`npm run lint`) with the repo-wide flat config and in CI.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
