import path from "node:path";
import { fileURLToPath } from "node:url";
if (process.env.VERCEL && !process.env.API_ORIGIN?.startsWith("https://")) {
  throw new Error(
    "Set API_ORIGIN to the deployed HTTPS backend before deploying the frontend.",
  );
}
const config = {
  turbopack: { root: path.dirname(fileURLToPath(import.meta.url)) },
  output: "standalone",
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${process.env.API_ORIGIN || "http://127.0.0.1:8100"}/:path*`,
        },
      ],
    };
  },
};
export default config;
