import { randomUUID } from "node:crypto"
import { db } from "../client"
import { categories } from "@repo/db/public/schema"

const CATEGORIES_DATA = [
  { name: "Electronics", description: "Audio, smart gadgets, and everyday electronics." },
  { name: "Kitchen", description: "Premium cookware, coffee tools, and kitchen essentials." },
  { name: "Outdoor", description: "Gear, backpacks, and accessories for open-air adventures." },
  { name: "Fitness", description: "Home gym equipment, recovery tools, and yoga essentials." },
  { name: "Books", description: "Curated technical guides, literature, and workbooks." },
  { name: "Toys", description: "Educational puzzles, drones, and creative kits." },
  { name: "Beauty", description: "Skincare, organic treatments, and personal care." },
  { name: "Automotive", description: "Car maintenance accessories, tools, and electronics." },
  { name: "Garden", description: "Planters, tools, and indoor greenery essentials." },
  { name: "Furniture", description: "Modern, ergonomic, and timeless home furnishings." },
]

export async function seedCategories(): Promise<Map<string, string>> {
  console.log("Seeding categories...")

  const categoryMap = new Map<string, string>()

  for (const cat of CATEGORIES_DATA) {
    const id = randomUUID()
    await db.insert(categories).values({
      id,
      name: cat.name,
      description: cat.description,
    })
    categoryMap.set(cat.name, id)
  }

  return categoryMap
}
