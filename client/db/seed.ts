import { config } from "dotenv";
config({ path: ".env.local" });

import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db } from "./index";
import { products, images } from "./schema";
import { user, account } from "../lib/auth-schema";
import { seed, reset } from "drizzle-seed";

const SEEDED_USER_PASSWORD = "secret password";

const picsumUrls = Array.from(
  { length: 300 },
  (_, i) => `https://picsum.photos/id/${i + 1}/800/600`,
);

async function main() {
  await reset(db, { products, images, user, account });

  await seed(db, { products, images, user }).refine((f) => ({
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
    user: {
      count: 20,
      columns: {
        name: f.fullName(),
        email: f.email(),
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

  const passwordHash = await hashPassword(SEEDED_USER_PASSWORD);
  const seededUsers = await db.select({ id: user.id }).from(user);

  await db.insert(account).values(
    seededUsers.map(({ id }) => ({
      id: randomUUID(),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: passwordHash,
    })),
  );

  console.log(
    `Seeded 100 products with 300 images and ${seededUsers.length} users (password: "${SEEDED_USER_PASSWORD}").`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
