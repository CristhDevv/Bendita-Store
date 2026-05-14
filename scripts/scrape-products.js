/**
 * scripts/scrape-products.js
 *
 * Scraper de Fragrantica con fallback a datos curados reales.
 * Uso: node scripts/scrape-products.js
 */

const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const https = require("https");

// ── Targets ───────────────────────────────────────────────────────────────────

const TARGETS = [
  { id: "1",  slug: "oud-royal-noir",   image_url: "https://fimgs.net/mdimg/perfume/375x500.17477.jpg",  fragrantica_url: "https://www.fragrantica.com/perfume/Christian-Dior/Oud-Ispahan-17477.html" },
  { id: "2",  slug: "jasmine-lumiere",  image_url: "https://fimgs.net/mdimg/perfume/375x500.1095.jpg",   fragrantica_url: "https://www.fragrantica.com/perfume/Chanel/No-5-Eau-de-Parfum-1095.html" },
  { id: "3",  slug: "cedar-vetiver",    image_url: "https://fimgs.net/mdimg/perfume/375x500.3036.jpg",   fragrantica_url: "https://www.fragrantica.com/perfume/Tom-Ford/Oud-Wood-3036.html" },
  { id: "4",  slug: "rose-celeste",     image_url: "https://fimgs.net/mdimg/perfume/375x500.45238.jpg",  fragrantica_url: "https://www.fragrantica.com/perfume/Creed/Aventus-45238.html" },
  { id: "5",  slug: "santal-33",        image_url: "https://fimgs.net/mdimg/perfume/375x500.18651.jpg",  fragrantica_url: "https://www.fragrantica.com/perfume/Le-Labo/Santal-33-18651.html" },
  { id: "6",  slug: "aqua-universalis", image_url: "https://fimgs.net/mdimg/perfume/375x500.39064.jpg",  fragrantica_url: "https://www.fragrantica.com/perfume/Maison-Margiela/REPLICA-Beach-Walk-39064.html" },
  { id: "7",  slug: "baccarat-rouge",   image_url: "https://fimgs.net/mdimg/perfume/375x500.56311.jpg",  fragrantica_url: "https://www.fragrantica.com/perfume/Maison-Francis-Kurkdjian/Baccarat-Rouge-540-Eau-de-Parfum-56311.html" },
  { id: "8",  slug: "tobacco-vanille",  image_url: "https://fimgs.net/mdimg/perfume/375x500.8100.jpg",   fragrantica_url: "https://www.fragrantica.com/perfume/Tom-Ford/Tobacco-Vanille-8100.html" },
  { id: "9",  slug: "chance-eau-tendre",image_url: "https://fimgs.net/mdimg/perfume/375x500.10408.jpg",  fragrantica_url: "https://www.fragrantica.com/perfume/Chanel/Chance-Eau-Tendre-Eau-de-Toilette-10408.html" },
  { id: "10", slug: "bleu-de-chanel",   image_url: "https://fimgs.net/mdimg/perfume/375x500.36667.jpg",  fragrantica_url: "https://www.fragrantica.com/perfume/Chanel/Bleu-de-Chanel-Eau-de-Parfum-36667.html" },
  { id: "11", slug: "black-opium",      image_url: "https://fimgs.net/mdimg/perfume/375x500.27163.jpg",  fragrantica_url: "https://www.fragrantica.com/perfume/Yves-Saint-Laurent/Black-Opium-Eau-de-Parfum-27163.html" },
  { id: "12", slug: "dylan-blue",       image_url: "https://fimgs.net/mdimg/perfume/375x500.35218.jpg",  fragrantica_url: "https://www.fragrantica.com/perfume/Versace/Dylan-Blue-Eau-de-Toilette-35218.html" },
];

// ── Datos curados reales ──────────────────────────────────────────────────────

const CURATED = {
  "oud-royal-noir":    { name: "Oud Ispahan", brand_name: "Dior", brand_slug: "dior", price: 520000, compare_price: 620000, concentration: "edp", gender: "unisex", description: "Oud Ispahan es una oda a la madera de oud, la más preciosa de las esencias orientales. Con notas de rosa, patchouli y labdanum, evoca la majestuosidad de los bazares persas. Una fragancia de una profundidad e intensidad excepcionales, creada por François Demachy.", notes_top: ["Rosa", "Labdanum"], notes_heart: ["Oud", "Patchouli"], notes_base: ["Sándalo", "Benjuí"], stock: 12, is_featured: true },
  "jasmine-lumiere":   { name: "N°5 Eau de Parfum", brand_name: "Chanel", brand_slug: "chanel", price: 480000, concentration: "parfum", gender: "women", description: "El perfume más icónico del mundo, creado en 1921 por Ernest Beaux para Coco Chanel. Una composición floral aldehídica que revolucionó la perfumería con su abstracción y modernidad. El N°5 encarna la feminidad elegante y atemporal.", notes_top: ["Aldehídos", "Bergamota", "Neroli"], notes_heart: ["Iris", "Rosa", "Jazmín", "Ylang Ylang"], notes_base: ["Civet", "Almizcle", "Sándalo", "Vetiver"], stock: 8, is_featured: true },
  "cedar-vetiver":     { name: "Oud Wood", brand_name: "Tom Ford", brand_slug: "tom-ford", price: 580000, compare_price: 680000, concentration: "edp", gender: "unisex", description: "Oud Wood fue la primera fragancia privada de Tom Ford en 2007. Una combinación magistral de oud, madera de roselina y palo de rosa con especias cálidas que crean una experiencia olfativa de lujo supremo.", notes_top: ["Oud", "Palo de Rosa", "Cardamomo"], notes_heart: ["Madera de Roselina", "Sándalo", "Vetiver"], notes_base: ["Ámbar Gris", "Musgo", "Tonka"], stock: 20, is_featured: true },
  "rose-celeste":      { name: "Aventus", brand_name: "Creed", brand_slug: "creed", price: 980000, concentration: "edp", gender: "men", description: "Aventus, creado en 2010, celebra la fuerza y el éxito. Inspirado en la vida de Napoleón Bonaparte, esta fragancia frutal-ahumada se ha convertido en una de las más celebradas de la perfumería de lujo moderna.", notes_top: ["Piña", "Grosella Negra", "Manzana", "Bergamota"], notes_heart: ["Abedul", "Patchouli", "Jazmín", "Rosa"], notes_base: ["Almizcle", "Ámbar Gris", "Musgo de Roble", "Vainilla"], stock: 5, is_featured: true },
  "santal-33":         { name: "Santal 33", brand_name: "Le Labo", brand_slug: "le-labo", price: 650000, concentration: "edp", gender: "unisex", description: "Santal 33 es la fragancia que definió una generación de perfumistas independientes. Cuero, madera de cedro y sándalo se funden en una composición que evoca el Gran Oeste americano.", notes_top: ["Cardamomo", "Iris", "Violeta", "Ambrox"], notes_heart: ["Cedro", "Sándalo de Australia", "Sándalo del Pacífico"], notes_base: ["Cuero", "Almizcle", "Cedro de Virginia"], stock: 15, is_featured: true },
  "aqua-universalis":  { name: "REPLICA Beach Walk", brand_name: "Maison Margiela", brand_slug: "maison-margiela", price: 340000, compare_price: 400000, concentration: "edt", gender: "unisex", description: "Beach Walk captura el recuerdo de un día perfecto en la playa: el aroma salino del mar, la crema solar en la piel caliente y la frescura de una brisa marina de verano.", notes_top: ["Bergamota", "Neroli", "Ámbar Gris"], notes_heart: ["Coco", "Rosa", "Crema Solar"], notes_base: ["Cedro", "Almizcle Blanco", "Heliotropo"], stock: 25, is_featured: true },
  "baccarat-rouge":    { name: "Baccarat Rouge 540", brand_name: "Maison Francis Kurkdjian", brand_slug: "mfk", price: 780000, concentration: "edp", gender: "unisex", description: "Baccarat Rouge 540 es la firma olfativa de la maison, creada en colaboración con la cristalería Baccarat. Jazmín, azafrán y madera de cedro capturan la esencia del cristal rojo de Baccarat.", notes_top: ["Jazmín", "Azafrán"], notes_heart: ["Ambroxan", "Madera de Cedro"], notes_base: ["Almizcle", "Resina de Abeto", "Ámbar"], stock: 4, is_featured: true },
  "tobacco-vanille":   { name: "Tobacco Vanille", brand_name: "Tom Ford", brand_slug: "tom-ford", price: 590000, compare_price: 690000, concentration: "edp", gender: "unisex", description: "Tobacco Vanille envuelve con notas de tabaco tostado, vainilla cremosa y especias dulces. Una sensación cálida e indulgente que evoca la elegancia de un club privado londinense.", notes_top: ["Tabaco", "Especias"], notes_heart: ["Vainilla", "Cacao", "Tonka"], notes_base: ["Madera de Castaño", "Madera Seca", "Vetiver"], stock: 10, is_featured: true },
  "chance-eau-tendre": { name: "Chance Eau Tendre", brand_name: "Chanel", brand_slug: "chanel", price: 320000, concentration: "edt", gender: "women", description: "Chance Eau Tendre es la expresión más joven y fresca de la familia Chance. Una fragancia floral-frutal de extrema feminidad que combina pomelo, jacinto e iris en una composición translúcida y vibrante.", notes_top: ["Pomelo", "Quince"], notes_heart: ["Jacinto", "Iris"], notes_base: ["Almizcle Blanco", "Cedro", "Ámbar"], stock: 18, is_featured: false },
  "bleu-de-chanel":    { name: "Bleu de Chanel EDP", brand_name: "Chanel", brand_slug: "chanel", price: 380000, compare_price: 450000, concentration: "edp", gender: "men", description: "Bleu de Chanel desafía las convenciones con su construcción limpia y fresca. Una fragancia para el hombre moderno: libre y determinado. Notas de limón, menta y cedro blanco.", notes_top: ["Limón", "Menta", "Pomelo", "Jengibre"], notes_heart: ["Iso E Super", "Nuez Moscada", "Jazmín"], notes_base: ["Cedro Blanco", "Vetiver", "Sándalo", "Ámbar Gris"], stock: 22, is_featured: true },
  "black-opium":       { name: "Black Opium", brand_name: "Yves Saint Laurent", brand_slug: "ysl", price: 295000, concentration: "edp", gender: "women", description: "Black Opium es la fragancia rock chic de YSL: adictiva, sensual y poderosa. La combinación audaz de café negro y vainilla blanca define a la mujer audaz, libre e imparable.", notes_top: ["Pera", "Flor de Naranjo", "Frambuesa"], notes_heart: ["Café", "Jazmín"], notes_base: ["Patchouli", "Cedro", "Almizcle", "Vainilla", "Cachemira"], stock: 14, is_featured: true },
  "dylan-blue":        { name: "Dylan Blue Pour Homme", brand_name: "Versace", brand_slug: "versace", price: 210000, compare_price: 265000, concentration: "edt", gender: "men", description: "Dylan Blue encarna la masculinidad mediterránea de Versace: poderosa y atemporal. Una fragancia acuática-fougère con notas de higo, violeta y patchouli.", notes_top: ["Uva", "Bergamota", "Higo"], notes_heart: ["Violeta", "Patchouli", "Incienso"], notes_base: ["Almizcle", "Ámbar", "Oud"], stock: 30, is_featured: false },
};

// ── Download image ────────────────────────────────────────────────────────────

function downloadImage(imageUrl, filename, outputDir) {
  return new Promise((resolve) => {
    const outputPath = path.join(outputDir, filename);
    if (fs.existsSync(outputPath)) {
      console.log(`  ↳ Already exists: ${filename}`);
      return resolve(true);
    }

    const file = fs.createWriteStream(outputPath);
    const req = https.get(imageUrl, {
      headers: {
        "Referer": "https://www.fragrantica.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      }
    }, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on("finish", () => { file.close(); console.log(`  ✓ Downloaded: ${filename}`); resolve(true); });
      } else {
        file.close();
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        console.log(`  ⚠ HTTP ${response.statusCode} for ${filename}`);
        resolve(false);
      }
    });
    req.on("error", (err) => {
      file.close();
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      console.log(`  ⚠ Error downloading ${filename}: ${err.message}`);
      resolve(false);
    });
    req.setTimeout(15000, () => {
      req.destroy();
      file.close();
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      console.log(`  ⚠ Timeout downloading ${filename}`);
      resolve(false);
    });
  });
}

// ── Try scrape ────────────────────────────────────────────────────────────────

async function tryFragranticaScrape(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      timeout: 10000,
    });
    const $ = cheerio.load(response.data);
    const description = $("[itemprop='description']").first().text().trim() ||
                        $(".fragrance-description").first().text().trim();
    if (description.length > 30) {
      console.log(`  ✓ Fragrantica description scraped (${description.length} chars)`);
      return { description: description.substring(0, 400) };
    }
    return {};
  } catch (err) {
    if (err.response?.status === 403) {
      console.log(`  ⚠ Cloudflare 403 — using curated data`);
    } else {
      console.log(`  ⚠ ${err.code || err.message} — using curated data`);
    }
    return {};
  }
}

// ── Generate TS ───────────────────────────────────────────────────────────────

function generateTs(products) {
  const lines = products.map((p) => {
    const cp = p.compare_price ? `, compare_price: ${p.compare_price}` : "";
    const desc = p.description.replace(/"/g, '\\"').replace(/\n/g, " ").substring(0, 350);
    const brandId = `b-${p.brand_slug}`;
    return `  { id: "${p.id}", name: "${p.name.replace(/"/g, '\\"')}", slug: "${p.slug}", price: ${p.price}${cp}, brand: { id: "${brandId}", name: "${p.brand_name}", slug: "${p.brand_slug}" }, concentration: "${p.concentration}", gender: "${p.gender}", description: "${desc}", images: ["/products/${p.slug}.jpg"], notes_top: ${JSON.stringify(p.notes_top)}, notes_heart: ${JSON.stringify(p.notes_heart)}, notes_base: ${JSON.stringify(p.notes_base)}, stock: ${p.stock}, is_featured: ${p.is_featured}, is_active: true, created_at: "2025-01-${p.id.padStart(2,"0")}" }`;
  });

  return `import type { Product } from "@/types";\n\n// Generated by scripts/scrape-products.js — real fragrance data\nexport const MOCK_PRODUCTS: Product[] = [\n${lines.join(",\n")},\n];\n`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌸 Bendita Store — Product Scraper\n================================\n");

  const outputDir = path.join(process.cwd(), "public", "products");
  if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir, { recursive: true }); }

  const results = [];

  for (const target of TARGETS) {
    const curated = CURATED[target.slug];
    if (!curated) { console.warn(`⚠ No data for: ${target.slug}`); continue; }

    console.log(`\n📦 ${curated.name} (${curated.brand_name})`);

    // Attempt live scrape
    const scraped = await tryFragranticaScrape(target.fragrantica_url);

    const product = {
      id: target.id,
      slug: target.slug,
      ...curated,
      description: scraped.description || curated.description,
    };

    // Download image
    await downloadImage(target.image_url, `${target.slug}.jpg`, outputDir);

    results.push(product);
    await new Promise(r => setTimeout(r, 1200));
  }

  const ts = generateTs(results);
  const productsPath = path.join(process.cwd(), "src", "lib", "mock", "products.ts");
  fs.writeFileSync(productsPath, ts, "utf-8");
  console.log(`\n✅ Updated: src/lib/mock/products.ts`);

  const realPath = path.join(process.cwd(), "src", "lib", "mock", "products-real.ts");
  fs.writeFileSync(realPath, ts, "utf-8");
  console.log(`✅ Created: src/lib/mock/products-real.ts`);

  console.log(`\n🎉 Done! ${results.length}/12 products processed.`);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
