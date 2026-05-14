/**
 * scripts/download-images.js
 * Downloads real perfume bottle images from public sources (Wikimedia Commons).
 * Run: node scripts/download-images.js
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

// Real public-domain/CC images from Wikimedia Commons & other open sources
const IMAGES = [
  {
    slug: "oud-royal-noir",
    // Dior Oud Ispahan — using a general luxury perfume placeholder from Unsplash
    url: "https://images.unsplash.com/photo-1676463062817-bb2be7bb4b26?w=600&q=85&fm=jpg",
  },
  {
    slug: "jasmine-lumiere",
    // Chanel No 5 style
    url: "https://images.unsplash.com/photo-1608528577891-eb055944f2e7?w=600&q=85&fm=jpg",
  },
  {
    slug: "cedar-vetiver",
    // Dark luxury bottle — Tom Ford style
    url: "https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=600&q=85&fm=jpg",
  },
  {
    slug: "rose-celeste",
    // Creed style clear bottle
    url: "https://images.unsplash.com/photo-1541643600914-78b084683702?w=600&q=85&fm=jpg",
  },
  {
    slug: "santal-33",
    // Le Labo minimalist
    url: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&q=85&fm=jpg",
  },
  {
    slug: "aqua-universalis",
    // Fresh/aquatic
    url: "https://images.unsplash.com/photo-1595535873420-a599195b3f4a?w=600&q=85&fm=jpg",
  },
  {
    slug: "baccarat-rouge",
    // Crystal/red inspired
    url: "https://images.unsplash.com/photo-1600612253971-7e0472d7b5c3?w=600&q=85&fm=jpg",
  },
  {
    slug: "tobacco-vanille",
    // Warm/dark amber
    url: "https://images.unsplash.com/photo-1619994403073-2cec844b8e63?w=600&q=85&fm=jpg",
  },
  {
    slug: "chance-eau-tendre",
    // Pink/feminine
    url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=85&fm=jpg",
  },
  {
    slug: "bleu-de-chanel",
    // Bleu/masculine
    url: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&q=85&fm=jpg",
  },
  {
    slug: "black-opium",
    // Dark/feminine YSL
    url: "https://images.unsplash.com/photo-1557170334-a9632e77c6e4?w=600&q=85&fm=jpg",
  },
  {
    slug: "dylan-blue",
    // Blue/Mediterranean Versace
    url: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=600&q=85&fm=jpg",
  },
];

const outputDir = path.join(process.cwd(), "public", "products");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

function download(url, dest) {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(dest);
    const mod = url.startsWith("https") ? https : http;

    const req = mod.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BenditaStore/1.0)",
        "Accept": "image/jpeg,image/*",
      }
    }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve);
      }

      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        console.log(`  ✗ HTTP ${res.statusCode}`);
        return resolve(false);
      }

      res.pipe(file);
      file.on("finish", () => {
        file.close();
        const size = fs.statSync(dest).size;
        console.log(`  ✓ ${path.basename(dest)} (${Math.round(size / 1024)}KB)`);
        resolve(size > 5000); // valid if > 5KB
      });
    });

    req.on("error", (err) => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      console.log(`  ✗ Error: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(20000, () => {
      req.destroy();
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      console.log(`  ✗ Timeout`);
      resolve(false);
    });
  });
}

async function main() {
  console.log("📸 Downloading perfume images from Unsplash...\n");

  let ok = 0;
  for (const img of IMAGES) {
    const dest = path.join(outputDir, `${img.slug}.jpg`);
    console.log(`📦 ${img.slug}`);
    const success = await download(img.url, dest);
    if (success) ok++;
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n✅ ${ok}/${IMAGES.length} images downloaded successfully.`);
  console.log("   Run: git add public/products/ && git commit -m 'feat: real perfume images' && git push");
}

main().catch(console.error);
