import { isPetVisitsReviewPreview, validateReviewApiBase } from "./src/lib/api-base";

const reviewPreview = isPetVisitsReviewPreview(process.env.VERCEL_ENV);

const apiOrigin = reviewPreview
  ? validateReviewApiBase(process.env)
  : "https://api.doglife.app";

export const config = {
  buildCommand: "npm run build",
  outputDirectory: "dist",
  framework: "vite",
  rewrites: [
    { source: "/api/:path*", destination: `${apiOrigin}/api/:path*` },
    { source: "/(.*)", destination: "/index.html" },
  ],
};
