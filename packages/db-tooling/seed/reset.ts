import { wipeDatabase } from "../wipe"

export async function resetDatabase() {
  console.log("Resetting database records...")
  await wipeDatabase({ force: true })
}
