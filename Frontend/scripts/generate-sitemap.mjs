import fs from "node:fs/promises";
import path from "node:path";

const siteUrl = (process.env.SITE_URL || "https://medixohealthcare.com").replace(/\/$/, "");
const apiUrl = (process.env.SITEMAP_API_URL || "http://127.0.0.1:5000/api").replace(/\/$/, "");
const publicDir = path.resolve("public");

const staticPaths = [
  "/",
  "/about",
  "/contact",
  "/doctors",
  "/hospitals",
  "/labs",
  "/privacy-policy",
  "/terms-conditions",
  "/delete-account",
];

const fetchRecords = async (resource) => {
  try {
    const response = await fetch(`${apiUrl}/${resource}`);
    if (!response.ok) return [];
    const records = await response.json();
    return Array.isArray(records) ? records : [];
  } catch (_error) {
    return [];
  }
};

const urls = new Set(staticPaths.map((item) => `${siteUrl}${item}`));
const [doctors, hospitals, clinics, labs] = await Promise.all([
  fetchRecords("doctors"),
  fetchRecords("hospitals"),
  fetchRecords("clinics"),
  fetchRecords("labs"),
]);

doctors.forEach((item) => item._id && urls.add(`${siteUrl}/doctors/${item._id}`));
hospitals.forEach((item) => item._id && urls.add(`${siteUrl}/hospitals/${item._id}`));
clinics.forEach((item) => item._id && urls.add(`${siteUrl}/clinics/${item._id}`));
labs.forEach((item) => item._id && urls.add(`${siteUrl}/labs/${item._id}`));

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...[...urls].map((url) => `  <url><loc>${url}</loc></url>`),
  "</urlset>",
  "",
].join("\n");

await fs.mkdir(publicDir, { recursive: true });
await fs.writeFile(path.join(publicDir, "sitemap.xml"), xml, "utf8");
console.log(`Generated sitemap with ${urls.size} URLs.`);
