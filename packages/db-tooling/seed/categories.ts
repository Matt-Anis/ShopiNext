import { randomUUID } from "node:crypto"
import { db } from "../client"
import { categories } from "@repo/db/public/schema"

const CATEGORIES_DATA = [
  {
    name: "Electronics",
    slug: "electronics",
    description: "Audio, smart gadgets, and everyday electronics.",
  },
  {
    name: "Kitchen",
    slug: "kitchen",
    description: "Premium cookware, coffee tools, and kitchen essentials.",
  },
  {
    name: "Outdoor",
    slug: "outdoor",
    description: "Gear, backpacks, and accessories for open-air adventures.",
  },
  {
    name: "Fitness",
    slug: "fitness",
    description: "Home gym equipment, recovery tools, and yoga essentials.",
  },
  {
    name: "Books",
    slug: "books",
    description: "Curated technical guides, literature, and workbooks.",
  },
  {
    name: "Toys",
    slug: "toys",
    description: "Educational puzzles, drones, and creative kits.",
  },
  {
    name: "Beauty",
    slug: "beauty",
    description: "Skincare, organic treatments, and personal care.",
  },
  {
    name: "Automotive",
    slug: "automotive",
    description: "Car maintenance accessories, tools, and electronics.",
  },
  {
    name: "Garden",
    slug: "garden",
    description: "Planters, tools, and indoor greenery essentials.",
  },
  {
    name: "Furniture",
    slug: "furniture",
    description: "Modern, ergonomic, and timeless home furnishings.",
  },
]

export async function seedCategories(): Promise<Map<string, string>> {
  console.log("Seeding categories...")

  const categoryMap = new Map<string, string>()

  for (const cat of CATEGORIES_DATA) {
    const id = randomUUID()
    await db.insert(categories).values({
      id,
      name: cat.name,
      slug: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: cat.description,
    })
    categoryMap.set(cat.name, id)
  }

  return categoryMap
}
