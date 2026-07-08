/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * scripts/download-missing.js
 * Downloads only the 3 missing perfume images.
 */


const https = require("https");
const fs = require("fs");
const path = require("path");

const MISSING = [
  {
    slug: "oud-royal-noir",
    url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=85&fm=jpg",
    fallback: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=85&fm=jpg",
  },
  {
    slug: "rose-celeste",
    url: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=85&fm=jpg",
    fallback: "https://images.unsplash.com/photo-1583573636398-a9f10b19bbad?w=600&q=85&fm=jpg",
  },
  {
    slug: "baccarat-rouge",
    url: "https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?w=600&q=85&fm=jpg",
    fallback: "https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=600&q=85&fm=jpg",
  },
];

const outputDir = path.join(process.cwd(), "public", "products");

function download(url, dest) {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "image/jpeg,image/*",
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve);
      }
      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        return resolve(false);
      }
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        const size = fs.statSync(dest).size;
        resolve(size > 10000 ? size : false);
      });
    });
    req.on("error", () => { file.close(); if (fs.existsSync(dest)) fs.unlinkSync(dest); resolve(false); });
    req.setTimeout(15000, () => { req.destroy(); file.close(); if (fs.existsSync(dest)) fs.unlinkSync(dest); resolve(false); });
  });
}

async function main() {
  console.log("📸 Downloading 3 missing images...\n");
  for (const img of MISSING) {
    const dest = path.join(outputDir, `${img.slug}.jpg`);
    console.log(`📦 ${img.slug}`);
    let size = await download(img.url, dest);
    if (!size) {
      console.log(`  ⚠ Primary failed, trying fallback...`);
      size = await download(img.fallback, dest);
    }
    if (size) {
      console.log(`  ✓ ${img.slug}.jpg (${Math.round(size / 1024)}KB)`);
    } else {
      console.log(`  ✗ Both URLs failed for ${img.slug}`);
    }
    await new Promise(r => setTimeout(r, 300));
  }
  console.log("\nDone.");
}

main().catch(console.error);
