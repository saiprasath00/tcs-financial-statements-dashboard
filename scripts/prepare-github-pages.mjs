import { cp, mkdir, stat } from "node:fs/promises";
import { join } from "node:path";

const clientDirectory = join(process.cwd(), "dist", "client");
const routes = ["assumptions", "forecast", "historical", "methodology", "scenarios", "sensitivity", "statements", "validation", "valuation"];
const indexFile = join(clientDirectory, "index.html");

try {
  await stat(indexFile);
} catch {
  throw new Error("GitHub Pages preparation requires dist/client/index.html. Run the production build first.");
}

for (const route of routes) {
  const routeDirectory = join(clientDirectory, route);
  await mkdir(routeDirectory, { recursive: true });
  await cp(indexFile, join(routeDirectory, "index.html"));
}

console.log(`Prepared ${routes.length} direct dashboard routes for GitHub Pages.`);
