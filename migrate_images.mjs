import { createClient } from "@supabase/supabase-js";
import ws from "ws";
globalThis.WebSocket = ws;

const supabaseUrl = "https://vtnmuphfaxjiziknchnk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0bm11cGhmYXhqaXppa25jaG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDM1ODcsImV4cCI6MjA5NDE3OTU4N30.uRSPHpLK5fMWv5E9Gd7vq1hgA90UEOXu77JZOmQa7xk";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Starting migration for 1 product...");

  // Get all products
  const { data: products, error: fetchError } = await supabase
    .from("products")
    .select("id, name, images");

  if (fetchError) {
    console.error("Error fetching products:", fetchError);
    return;
  }

  const productsToMigrate = products.filter(p => p.images && p.images.length > 0 && p.images[0].startsWith("data:image"));
  
  if (productsToMigrate.length === 0) {
    console.log("No more products found with base64 images.");
    return;
  }

  console.log(`Found ${productsToMigrate.length} products to migrate.`);
  
  let successCount = 0;
  let errorCount = 0;

  for (const product of productsToMigrate) {
    console.log(`\nMigrating product: ${product.name} (${product.id})`);
    const newImages = [];
    let hasError = false;

    for (let i = 0; i < product.images.length; i++) {
      const base64Data = product.images[i];
      
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        console.log(`Image ${i} is not a valid base64 string, skipping.`);
        newImages.push(base64Data);
        continue;
      }

      const type = matches[1];
      const buffer = Buffer.from(matches[2], "base64");
      const extension = type.split("/")[1] === "jpeg" ? "jpg" : type.split("/")[1];
      const fileName = `${product.id}/${i}.${extension}`;

      console.log(`Uploading ${fileName}...`);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("products")
        .upload(fileName, buffer, {
          contentType: type,
          upsert: true
        });

      if (uploadError) {
        console.error(`Error uploading image ${i}:`, uploadError);
        hasError = true;
        break;
      }

      const { data: publicUrlData } = supabase.storage
        .from("products")
        .getPublicUrl(fileName);

      newImages.push(publicUrlData.publicUrl);
    }

    if (!hasError) {
      console.log("Updating product in DB...");
      const { error: updateError } = await supabase
        .from("products")
        .update({ images: newImages })
        .eq("id", product.id);

      if (updateError) {
        console.error("Error updating product:", updateError);
        errorCount++;
      } else {
        successCount++;
        console.log("Successfully migrated!");
      }
    } else {
      errorCount++;
    }
  }

  console.log(`\nMigration Summary: ${successCount} successful, ${errorCount} errors.`);
}

run();
