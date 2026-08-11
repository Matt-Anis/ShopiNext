import { config } from "dotenv";
config({ path: ".env.local" });

import { inArray } from "drizzle-orm";
import { db } from "./index";
import { products, images } from "./schema";
import { seed, reset } from "drizzle-seed";

const picsumUrls = Array.from(
  { length: 300 },
  (_, i) => `https://picsum.photos/id/${i + 1}/800/600`,
);

async function main() {
  await reset(db, { products, images });

  await seed(db, { products, images }).refine((f) => ({
    products: {
      count: 100,
      columns: {
        price: f.int({ minValue: 999, maxValue: 99999 }),
      },
      with: {
        images: 3,
      },
    },
    images: {
      columns: {
        url: f.valuesFromArray({ values: picsumUrls }),
        altText: f.loremIpsum({ sentencesCount: 1 }),
        isPrimary: f.default({ defaultValue: false }),
      },
    },
  }));

  await db
    .update(images)
    .set({ isPrimary: true })
    .where(
      inArray(
        images.id,
        db
          .selectDistinctOn([images.productId], { id: images.id })
          .from(images)
          .orderBy(images.productId, images.id),
      ),
    );

  console.log("Seeded 100 products with 300 images.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
