export const pageMeta = (title: string, description: string) => ({
  meta: [
    { title: `${title} — TCS Financial Forecasting Model` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — TCS Financial Forecasting Model` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
