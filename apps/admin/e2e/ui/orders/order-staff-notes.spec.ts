import { test, expect } from "@playwright/test"
import { eq } from "drizzle-orm"
import { adminOrderNotes } from "@repo/db/admin/schema"
import { testDb } from "../../utils/db"
import { seedAdmin } from "../../utils/seed-user"
import { seedOrder, seedAdminOrderNote } from "../../utils/seed-order"
import { signIn } from "../../utils/auth"
import { uniqueSuffix } from "../../utils/unique"

let admin: Awaited<ReturnType<typeof seedAdmin>>

test.beforeEach(async () => {
  admin = await seedAdmin()
})

test.describe("Order staff notes feed", () => {
  test("shows empty state when no internal staff notes exist", async ({
    page,
  }) => {
    const order = await seedOrder()

    await signIn(page, admin)
    await page.goto(`/orders/${order.id}`)

    const notesSection = page.locator("section", {
      hasText: "Internal Staff Notes",
    })
    await expect(notesSection).toBeVisible()
    await expect(
      notesSection.getByText("No internal staff notes on this order yet.")
    ).toBeVisible()
  })

  test("posts a staff note using the send button and renders in the feed", async ({
    page,
  }) => {
    const order = await seedOrder()

    await signIn(page, admin)
    await page.goto(`/orders/${order.id}`)

    const notesSection = page.locator("section", {
      hasText: "Internal Staff Notes",
    })
    const textarea = notesSection.getByPlaceholder("Send a note...")
    const sendButton = notesSection.getByRole("button", { name: "Send note" })

    await expect(sendButton).toBeDisabled()

    const noteContent = `Customer verified delivery details ${uniqueSuffix()}`
    await textarea.fill(noteContent)
    await expect(sendButton).toBeEnabled()

    await sendButton.click()

    await expect(textarea).toHaveValue("")
    await expect(notesSection.getByText(noteContent)).toBeVisible()
    await expect(notesSection.getByText(admin.name)).toBeVisible()
    await expect(notesSection.getByText("You")).toBeVisible()

    const [dbNote] = await testDb
      .select()
      .from(adminOrderNotes)
      .where(eq(adminOrderNotes.orderId, order.id))
    expect(dbNote?.content).toBe(noteContent)
    expect(dbNote?.adminUserId).toBe(admin.id)
  })

  test("posts a staff note via Enter key and supports multiline with Shift+Enter", async ({
    page,
  }) => {
    const order = await seedOrder()

    await signIn(page, admin)
    await page.goto(`/orders/${order.id}`)

    const notesSection = page.locator("section", {
      hasText: "Internal Staff Notes",
    })
    const textarea = notesSection.getByPlaceholder("Send a note...")

    await textarea.focus()
    await textarea.fill("First line")
    await page.keyboard.press("Shift+Enter")
    await textarea.pressSequentially("Second line")

    await page.keyboard.press("Enter")

    await expect(textarea).toHaveValue("")
    await expect(
      notesSection.getByText("First line\nSecond line")
    ).toBeVisible()
  })

  test("distinguishes current user notes with 'You' badge from other staff members", async ({
    page,
  }) => {
    const otherAdmin = await seedAdmin({ name: "Other Staff Member" })
    const order = await seedOrder()

    const otherNoteContent = `Other staff comment ${uniqueSuffix()}`
    const myNoteContent = `My own comment ${uniqueSuffix()}`

    await seedAdminOrderNote(order.id, otherAdmin.id, otherNoteContent)
    await seedAdminOrderNote(order.id, admin.id, myNoteContent)

    await signIn(page, admin)
    await page.goto(`/orders/${order.id}`)

    const notesSection = page.locator("section", {
      hasText: "Internal Staff Notes",
    })

    const otherRow = notesSection.locator(".group", {
      hasText: otherNoteContent,
    })
    await expect(otherRow).toBeVisible()
    await expect(otherRow).toContainText(otherAdmin.name)
    await expect(otherRow.getByText("You")).toHaveCount(0)

    const myRow = notesSection.locator(".group", { hasText: myNoteContent })
    await expect(myRow).toBeVisible()
    await expect(myRow).toContainText(admin.name)
    await expect(myRow.getByText("You")).toBeVisible()
  })

  test("renders date separators grouping notes by day", async ({ page }) => {
    const order = await seedOrder()

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    await seedAdminOrderNote(
      order.id,
      admin.id,
      "Yesterday note",
      yesterday
    )
    await seedAdminOrderNote(
      order.id,
      admin.id,
      "Today note",
      new Date()
    )

    await signIn(page, admin)
    await page.goto(`/orders/${order.id}`)

    const notesSection = page.locator("section", {
      hasText: "Internal Staff Notes",
    })

    await expect(
      notesSection.getByText("Yesterday", { exact: true })
    ).toBeVisible()
    await expect(
      notesSection.getByText("Today", { exact: true })
    ).toBeVisible()
  })
})
