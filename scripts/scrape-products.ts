/**
 * scripts/scrape-products.ts
 *
 * Intenta scraping de Fragrantica para obtener datos reales de perfumes.
 * Si Cloudflare bloquea (403), usa datos curados reales como fallback.
 *
 * Uso: npx ts-node scripts/scrape-products.ts
 */

import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";

// ── Tipos ────────────────────────────────────────────────────────────────────

interface ScrapedProduct {
  id: string;
  name: string;
  slug: string;
  brand_name: string;
  brand_slug: string;
  price: number;
  compare_price?: number;
  concentration: string;
  gender: string;
  description: string;
  notes_top: string[];
  notes_heart: string[];
  notes_base: string[];
  stock: number;
  is_featured: boolean;
  image_filename: string;
  fragrantica_url: string;
  image_url: string;
}

// ── Datos objetivo ────────────────────────────────────────────────────────────

const TARGETS = [
  {
    id: "1",
    slug: "oud-royal-noir",
    fragrantica_url: "https://www.fragrantica.com/perfume/Christian-Dior/Oud-Ispahan-17477.html",
    image_url: "https://fimgs.net/mdimg/perfume/375x500.17477.jpg",
  },
  {
    id: "2",
    slug: "jasmine-lumiere",
    fragrantica_url: "https://www.fragrantica.com/perfume/Chanel/No-5-Eau-de-Parfum-1095.html",
    image_url: "https://fimgs.net/mdimg/perfume/375x500.1095.jpg",
  },
  {
    id: "3",
    slug: "cedar-vetiver",
    fragrantica_url: "https://www.fragrantica.com/perfume/Tom-Ford/Oud-Wood-3036.html",
    image_url: "https://fimgs.net/mdimg/perfume/375x500.3036.jpg",
  },
  {
    id: "4",
    slug: "rose-celeste",
    fragrantica_url: "https://www.fragrantica.com/perfume/Creed/Aventus-45238.html",
    image_url: "https://fimgs.net/mdimg/perfume/375x500.45238.jpg",
  },
  {
    id: "5",
    slug: "santal-33",
    fragrantica_url: "https://www.fragrantica.com/perfume/Le-Labo/Santal-33-18651.html",
    image_url: "https://fimgs.net/mdimg/perfume/375x500.18651.jpg",
  },
  {
    id: "6",
    slug: "aqua-universalis",
    fragrantica_url: "https://www.fragrantica.com/perfume/Maison-Margiela/REPLICA-Beach-Walk-39064.html",
    image_url: "https://fimgs.net/mdimg/perfume/375x500.39064.jpg",
  },
  {
    id: "7",
    slug: "baccarat-rouge",
    fragrantica_url: "https://www.fragrantica.com/perfume/Maison-Francis-Kurkdjian/Baccarat-Rouge-540-Eau-de-Parfum-56311.html",
    image_url: "https://fimgs.net/mdimg/perfume/375x500.56311.jpg",
  },
  {
    id: "8",
    slug: "tobacco-vanille",
    fragrantica_url: "https://www.fragrantica.com/perfume/Tom-Ford/Tobacco-Vanille-8100.html",
    image_url: "https://fimgs.net/mdimg/perfume/375x500.8100.jpg",
  },
  {
    id: "9",
    slug: "chance-eau-tendre",
    fragrantica_url: "https://www.fragrantica.com/perfume/Chanel/Chance-Eau-Tendre-Eau-de-Toilette-10408.html",
    image_url: "https://fimgs.net/mdimg/perfume/375x500.10408.jpg",
  },
  {
    id: "10",
    slug: "bleu-de-chanel",
    fragrantica_url: "https://www.fragrantica.com/perfume/Chanel/Bleu-de-Chanel-Eau-de-Parfum-36667.html",
    image_url: "https://fimgs.net/mdimg/perfume/375x500.36667.jpg",
  },
  {
    id: "11",
    slug: "black-opium",
    fragrantica_url: "https://www.fragrantica.com/perfume/Yves-Saint-Laurent/Black-Opium-Eau-de-Parfum-27163.html",
    image_url: "https://fimgs.net/mdimg/perfume/375x500.27163.jpg",
  },
  {
    id: "12",
    slug: "dylan-blue",
    fragrantica_url: "https://www.fragrantica.com/perfume/Versace/Dylan-Blue-Eau-de-Toilette-35218.html",
    image_url: "https://fimgs.net/mdimg/perfume/375x500.35218.jpg",
  },
];

// ── Datos curados reales (fallback cuando Fragrantica bloquea) ────────────────

const CURATED_DATA: Record<string, Omit<ScrapedProduct, "id" | "slug" | "fragrantica_url" | "image_url" | "image_filename">> = {
  "oud-royal-noir": {
    name: "Oud Ispahan",
    brand_name: "Dior",
    brand_slug: "dior",
    price: 520000,
    compare_price: 620000,
    concentration: "edp",
    gender: "unisex",
    description: "Oud Ispahan es una oda a la madera de oud, la más preciosa de las esencias orientales. Con notas de rosa, patchouli y labdanum, evoca la majestuosidad de los bazares persas. Una fragancia de una profundidad e intensidad excepcionales, creada por François Demachy.",
    notes_top: ["Rosa", "Labdanum"],
    notes_heart: ["Oud", "Patchouli"],
    notes_base: ["Madera de Sándalo", "Benjuí"],
    stock: 12,
    is_featured: true,
  },
  "jasmine-lumiere": {
    name: "N°5 Eau de Parfum",
    brand_name: "Chanel",
    brand_slug: "chanel",
    price: 480000,
    concentration: "parfum",
    gender: "women",
    description: "El perfume más icónico del mundo, creado en 1921 por Ernest Beaux para Coco Chanel. Una composición floral aldehídica que revolucionó la perfumería con su abstracción y modernidad. El N°5 encarna la feminidad elegante y atemporal de la mujer Chanel.",
    notes_top: ["Aldehídos", "Bergamota", "Limón", "Neroli"],
    notes_heart: ["Iris", "Rosa", "Jazmín", "Ylang Ylang", "Lirio del Valle"],
    notes_base: ["Civet", "Almizcle", "Ámbar", "Sándalo", "Vetiver"],
    stock: 8,
    is_featured: true,
  },
  "cedar-vetiver": {
    name: "Oud Wood",
    brand_name: "Tom Ford",
    brand_slug: "tom-ford",
    price: 580000,
    compare_price: 680000,
    concentration: "edp",
    gender: "unisex",
    description: "Oud Wood fue la primera fragancia privada de Tom Ford en 2007 y se convirtió en un referente del género. Una combinación magistral de oud, madera de roselina y palo de rosa, con especias cálidas que crean una experiencia olfativa de lujo supremo.",
    notes_top: ["Oud", "Palo de Rosa", "Cardamomo"],
    notes_heart: ["Madera de Roselina", "Sándalo", "Vetiver"],
    notes_base: ["Ámbar Gris", "Musgo", "Tonka"],
    stock: 20,
    is_featured: true,
  },
  "rose-celeste": {
    name: "Aventus",
    brand_name: "Creed",
    brand_slug: "creed",
    price: 980000,
    concentration: "edp",
    gender: "men",
    description: "Aventus, creado en 2010, celebra la fuerza, el éxito y el poder del liderazgo. Inspirado en la vida tumultuosa de Napoleón Bonaparte, esta fragancia frutal-ahumada se ha convertido en una de las más celebradas de la perfumería de lujo moderna.",
    notes_top: ["Piña", "Grosella Negra", "Manzana", "Bergamota"],
    notes_heart: ["Abedul", "Patchouli", "Jazmín", "Rosa"],
    notes_base: ["Almizcle", "Ámbar Gris", "Musgo de Roble", "Vainilla"],
    stock: 5,
    is_featured: true,
  },
  "santal-33": {
    name: "Santal 33",
    brand_name: "Le Labo",
    brand_slug: "le-labo",
    price: 650000,
    concentration: "edp",
    gender: "unisex",
    description: "Santal 33 es la fragancia que definió una generación de perfumistas independientes. Creada por Frank Voelkl, evoca el Gran Oeste americano: cuero, madera de cedro y sándalo se funden en una composición que se ha convertido en el aroma más reconocido de la perfumería de nicho.",
    notes_top: ["Cardamomo", "Iris", "Violeta", "Ambrox"],
    notes_heart: ["Madera de Cedro", "Sándalo de Australia", "Sándalo del Pacífico"],
    notes_base: ["Cuero", "Almizcle", "Cedro de Virginia", "Papiro"],
    stock: 15,
    is_featured: true,
  },
  "aqua-universalis": {
    name: "REPLICA Beach Walk",
    brand_name: "Maison Margiela",
    brand_slug: "maison-margiela",
    price: 340000,
    compare_price: 400000,
    concentration: "edt",
    gender: "unisex",
    description: "Beach Walk captura el recuerdo de un día en la playa: el aroma salino del mar, la crema solar en la piel caliente por el sol y la frescura de una brisa marina. Una fragancia que transporta instantáneamente a ese estado de relajación absoluta del verano.",
    notes_top: ["Bergamota", "Neroli", "Ámbar Gris"],
    notes_heart: ["Coco", "Rosa", "Crema Solar"],
    notes_base: ["Madera de Cedro", "Almizcle Blanco", "Heliotropo"],
    stock: 25,
    is_featured: true,
  },
  "baccarat-rouge": {
    name: "Baccarat Rouge 540",
    brand_name: "Maison Francis Kurkdjian",
    brand_slug: "mfk",
    price: 780000,
    concentration: "edp",
    gender: "unisex",
    description: "Baccarat Rouge 540 es la firma olfativa de la maison, creada por Francis Kurkdjian en colaboración con la cristalería Baccarat. Una composición luminosa y etérea de jazmín, azafrán y madera de cedro que captura la esencia del cristal rojo de Baccarat.",
    notes_top: ["Jazmín", "Azafrán"],
    notes_heart: ["Ambroxan", "Madera de Cedro"],
    notes_base: ["Almizcle", "Resina de Abeto", "Ámbar"],
    stock: 4,
    is_featured: true,
  },
  "tobacco-vanille": {
    name: "Tobacco Vanille",
    brand_name: "Tom Ford",
    brand_slug: "tom-ford",
    price: 590000,
    compare_price: 690000,
    concentration: "edp",
    gender: "unisex",
    description: "Tobacco Vanille es una de las fragancias privadas más queridas de Tom Ford. Envuelve con notas de tabaco tostado, vainilla cremosa y especias dulces, creando una sensación cálida e indulgente que evoca la elegancia de un club privado londinense.",
    notes_top: ["Tabaco", "Especias"],
    notes_heart: ["Vainilla", "Cacao", "Tonka", "Azúcar de Tabaco"],
    notes_base: ["Madera de Castaño", "Madera Seca", "Vetiver"],
    stock: 10,
    is_featured: true,
  },
  "chance-eau-tendre": {
    name: "Chance Eau Tendre",
    brand_name: "Chanel",
    brand_slug: "chanel",
    price: 320000,
    concentration: "edt",
    gender: "women",
    description: "Chance Eau Tendre es la expresión más joven y fresca de la familia Chance. Una fragancia floral-frutal de extrema feminidad que combina el pomelo, el jacinto y el iris en una composición translúcida y vibrante, ideal para el día a día.",
    notes_top: ["Pomelo", "Quince"],
    notes_heart: ["Jacinto", "Iris"],
    notes_base: ["Almizcle Blanco", "Cedro", "Ámbar"],
    stock: 18,
    is_featured: false,
  },
  "bleu-de-chanel": {
    name: "Bleu de Chanel",
    brand_name: "Chanel",
    brand_slug: "chanel",
    price: 380000,
    compare_price: 450000,
    concentration: "edp",
    gender: "men",
    description: "Bleu de Chanel es un wood aromatic que desafía las convenciones con su construcción limpia y fresca. Jacques Polge creó una fragancia para el hombre moderno: libre, determinado, en constante movimiento. Notas de limón, menta y cedro blanco.",
    notes_top: ["Limón", "Menta", "Pomelo", "Jengibre"],
    notes_heart: ["Iso E Super", "Nuez Moscada", "Jazmín"],
    notes_base: ["Cedro Blanco", "Vetiver", "Sándalo", "Ámbar Gris"],
    stock: 22,
    is_featured: true,
  },
  "black-opium": {
    name: "Black Opium",
    brand_name: "Yves Saint Laurent",
    brand_slug: "ysl",
    price: 295000,
    concentration: "edp",
    gender: "women",
    description: "Black Opium es la fragancia rock chic de YSL: adictiva, sensual y poderosa. La combinación audaz de café negro y vainilla blanca crea un contraste dramático que define a la mujer que la usa: audaz, libre e imparable.",
    notes_top: ["Pera", "Flor de Naranjo", "Frambuesa"],
    notes_heart: ["Café", "Jazmín"],
    notes_base: ["Patchouli", "Cedro", "Almizcle", "Vainilla", "Cachemira"],
    stock: 14,
    is_featured: true,
  },
  "dylan-blue": {
    name: "Dylan Blue Pour Homme",
    brand_name: "Versace",
    brand_slug: "versace",
    price: 210000,
    compare_price: 265000,
    concentration: "edt",
    gender: "men",
    description: "Dylan Blue encarna la masculinidad griega moderna de Versace: poderosa, mediterránea y atemporal. Una fragancia acuática-fougère con notas de higo, violeta y patchouli que rinden homenaje al espíritu aventurero del hombre Versace.",
    notes_top: ["Uva", "Bergamota", "Higo"],
    notes_heart: ["Violeta", "Pachulí", "Incienso"],
    notes_base: ["Almizcle", "Ámbar", "Oud"],
    stock: 30,
    is_featured: false,
  },
};

// ── Funciones auxiliares ─────────────────────────────────────────────────────

async function tryFragranticaScrape(url: string): Promise<Partial<ScrapedProduct>> {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    
    // Fragrantica selectors (may change with site updates)
    const name = $("h1[itemprop='name']").first().text().trim() ||
                 $("h1").first().text().trim();
    const description = $("[itemprop='description']").first().text().trim() ||
                        $(".perfume-description").first().text().trim();
    const imageUrl = $("[itemprop='image']").attr("src") ||
                     $(".perfume-image img").attr("src") || "";

    console.log(`  ✓ Scraped: ${name || "unknown"}`);
    return { name, description };
  } catch (err: any) {
    if (err.response?.status === 403) {
      console.log(`  ⚠ Cloudflare blocked (403) — using curated data`);
    } else if (err.code === "ECONNRESET" || err.code === "ETIMEDOUT") {
      console.log(`  ⚠ Connection error — using curated data`);
    } else {
      console.log(`  ⚠ Error: ${err.message} — using curated data`);
    }
    return {};
  }
}

async function downloadImage(imageUrl: string, filename: string, outputDir: string): Promise<boolean> {
  const outputPath = path.join(outputDir, filename);
  
  if (fs.existsSync(outputPath)) {
    console.log(`  ↳ Image already exists: ${filename}`);
    return true;
  }

  return new Promise((resolve) => {
    const file = fs.createWriteStream(outputPath);
    https.get(imageUrl, {
      headers: {
        "Referer": "https://www.fragrantica.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      }
    }, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log(`  ✓ Downloaded: ${filename}`);
          resolve(true);
        });
      } else {
        file.close();
        fs.unlinkSync(outputPath);
        console.log(`  ⚠ Failed to download ${filename}: HTTP ${response.statusCode}`);
        resolve(false);
      }
    }).on("error", (err) => {
      file.close();
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      console.log(`  ⚠ Download error for ${filename}: ${err.message}`);
      resolve(false);
    });
  });
}

function generateProductsTs(products: ScrapedProduct[]): string {
  const lines = products.map((p) => {
    const img = `"/products/${p.image_filename}"`;
    const comparePrice = p.compare_price ? `, compare_price: ${p.compare_price}` : "";
    const notesTop = JSON.stringify(p.notes_top);
    const notesHeart = JSON.stringify(p.notes_heart);
    const notesBase = JSON.stringify(p.notes_base);

    return `  {
    id: "${p.id}",
    name: "${p.name.replace(/"/g, '\\"')}",
    slug: "${p.slug}",
    price: ${p.price}${comparePrice},
    brand: { id: "b-${p.brand_slug}", name: "${p.brand_name}", slug: "${p.brand_slug}" },
    concentration: "${p.concentration}",
    gender: "${p.gender}",
    description: "${p.description.replace(/"/g, '\\"').replace(/\n/g, " ").substring(0, 300)}",
    images: [${img}],
    notes_top: ${notesTop},
    notes_heart: ${notesHeart},
    notes_base: ${notesBase},
    stock: ${p.stock},
    is_featured: ${p.is_featured},
    is_active: true,
    created_at: "2025-01-0${p.id}",
  }`;
  });

  return `import type { Product } from "@/types";

/**
 * Products data from Fragrantica scraping + curated real data.
 * Generated by scripts/scrape-products.ts
 */
export const MOCK_PRODUCTS: Product[] = [
${lines.join(",\n")}
];
`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌸 Bendita Store — Product Data Scraper");
  console.log("=========================================\n");

  const outputDir = path.join(process.cwd(), "public", "products");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created: public/products/\n`);
  }

  const results: ScrapedProduct[] = [];

  for (const target of TARGETS) {
    const curated = CURATED_DATA[target.slug];
    if (!curated) {
      console.warn(`⚠ No curated data for slug: ${target.slug}`);
      continue;
    }

    console.log(`\n📦 Processing: ${curated.name} (${curated.brand_name})`);
    console.log(`   URL: ${target.fragrantica_url}`);

    // Attempt live scrape (may be blocked by Cloudflare)
    const scraped = await tryFragranticaScrape(target.fragrantica_url);

    // Merge: prefer scraped data, fallback to curated
    const product: ScrapedProduct = {
      id: target.id,
      slug: target.slug,
      fragrantica_url: target.fragrantica_url,
      image_url: target.image_url,
      image_filename: `${target.slug}.jpg`,
      ...curated,
      // Override with scraped if available
      name: scraped.name || curated.name,
      description: scraped.description || curated.description,
    };

    // Download image
    console.log(`  ⬇ Downloading image...`);
    await downloadImage(target.image_url, product.image_filename, outputDir);

    results.push(product);
    
    // Polite delay between requests
    await new Promise(r => setTimeout(r, 1500));
  }

  // Write products-real.ts
  const tsContent = generateProductsTs(results);
  const outputTs = path.join(process.cwd(), "src", "lib", "mock", "products-real.ts");
  fs.writeFileSync(outputTs, tsContent, "utf-8");
  console.log(`\n✅ Written: src/lib/mock/products-real.ts`);

  // Also overwrite the main products.ts
  const mainTs = path.join(process.cwd(), "src", "lib", "mock", "products.ts");
  fs.writeFileSync(mainTs, tsContent.replace("products-real.ts", "products.ts"), "utf-8");
  console.log(`✅ Updated: src/lib/mock/products.ts`);

  console.log(`\n🎉 Done! ${results.length} products processed.`);
  console.log(`   Run: npm run build && vercel --prod --force`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
