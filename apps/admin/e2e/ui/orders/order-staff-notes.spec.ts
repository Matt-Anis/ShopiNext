import { test, expect } from "@playwright/test"
import { eq } from "drizzle-orm"
import { adminOrderNotes } from "@repo/db/admin/schema"
import { testDb } from "../../utils/db"
import { seedAdmin } from "../../utils/seed-user"
import { seedOrder, seedAdminOrderNote } from "../../utils/seed-order"
import { signIn } from "../../utils/auth"
import { uniqueSuffix } from "../../utils/unique"
import { clickUntilHydrated } from "../../utils/interaction"

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

  test("edits an existing staff note inline after confirmation", async ({
    page,
  }) => {
    test.slow()
    const order = await seedOrder()
    const initialContent = `Initial comment ${uniqueSuffix()}`
    const updatedContent = `Updated comment ${uniqueSuffix()}`

    await seedAdminOrderNote(order.id, admin.id, initialContent)

    await signIn(page, admin)
    await page.goto(`/orders/${order.id}`)

    const notesSection = page.locator("section", {
      hasText: "Internal Staff Notes",
    })
    const noteRow = notesSection.locator(".group", {
      hasText: initialContent,
    })

    await noteRow.hover()
    const editButton = noteRow.getByRole("button", { name: "Edit note" })
    const editTextarea = notesSection.locator(".group textarea")

    await clickUntilHydrated(editButton, async () => {
      await expect(editTextarea).toBeVisible()
    })
    await expect(editTextarea).toHaveValue(initialContent)

    // Save checkmark is not visible before edits (not polluted)
    const saveButton = notesSection.getByRole("button", { name: "Save changes" })
    await expect(saveButton).toBeHidden()

    // Pollute content
    await editTextarea.fill(updatedContent)
    await expect(saveButton).toBeVisible()

    await saveButton.click()

    // Confirmation dialog
    const confirmDialog = page.getByRole("alertdialog")
    await expect(confirmDialog).toBeVisible()
    await expect(
      confirmDialog.getByText("Update staff note")
    ).toBeVisible()

    const confirmButton = confirmDialog.getByRole("button", {
      name: "Save changes",
    })
    await confirmButton.click()

    // Wait for UI to update
    await expect(confirmDialog).toBeHidden()
    const updatedRow = notesSection.locator(".group", {
      hasText: updatedContent,
    })
    await expect(updatedRow).toBeVisible()
    await expect(updatedRow.getByText("(edited)")).toBeVisible()

    // DB verification with expect.poll
    await expect
      .poll(async () => {
        const [dbNote] = await testDb
          .select()
          .from(adminOrderNotes)
          .where(eq(adminOrderNotes.orderId, order.id))
        return dbNote?.content
      })
      .toBe(updatedContent)
  })

  test("cancelling an inline edit leaves note content untouched", async ({
    page,
  }) => {
    const order = await seedOrder()
    const noteContent = `Untouched note ${uniqueSuffix()}`

    await seedAdminOrderNote(order.id, admin.id, noteContent)

    await signIn(page, admin)
    await page.goto(`/orders/${order.id}`)

    const notesSection = page.locator("section", {
      hasText: "Internal Staff Notes",
    })
    const noteRow = notesSection.locator(".group", {
      hasText: noteContent,
    })

    await noteRow.hover()
    const editButton = noteRow.getByRole("button", { name: "Edit note" })
    const editTextarea = notesSection.locator(".group textarea")

    await clickUntilHydrated(editButton, async () => {
      await expect(editTextarea).toBeVisible()
    })

    await editTextarea.fill(`Dirty change ${uniqueSuffix()}`)

    const cancelButton = notesSection.getByRole("button", {
      name: "Cancel edit",
    })
    await cancelButton.click()

    await expect(editTextarea).toBeHidden()
    await expect(noteRow.getByText(noteContent)).toBeVisible()

    const [dbNote] = await testDb
      .select()
      .from(adminOrderNotes)
      .where(eq(adminOrderNotes.orderId, order.id))
    expect(dbNote?.content).toBe(noteContent)
  })

  test("deletes an existing staff note after confirmation", async ({
    page,
  }) => {
    test.slow()
    const order = await seedOrder()
    const noteContent = `Note to delete ${uniqueSuffix()}`

    await seedAdminOrderNote(order.id, admin.id, noteContent)

    await signIn(page, admin)
    await page.goto(`/orders/${order.id}`)

    const notesSection = page.locator("section", {
      hasText: "Internal Staff Notes",
    })
    const noteRow = notesSection.locator(".group", {
      hasText: noteContent,
    })

    const deleteButton = noteRow.getByRole("button", { name: "Delete note" })
    const confirmDialog = page.getByRole("alertdialog")

    await noteRow.hover()
    await clickUntilHydrated(deleteButton, async () => {
      await expect(confirmDialog).toBeVisible()
    })

    const confirmDeleteButton = confirmDialog.getByRole("button", {
      name: "Delete",
    })
    await confirmDeleteButton.click()

    // Web-first removal assertion
    await expect(noteRow).toBeHidden()

    // DB verification with expect.poll
    await expect
      .poll(async () => {
        const rows = await testDb
          .select()
          .from(adminOrderNotes)
          .where(eq(adminOrderNotes.orderId, order.id))
        return rows.length
      })
      .toBe(0)
  })

  test("does not display edit or delete buttons on notes authored by other staff", async ({
    page,
  }) => {
    const otherAdmin = await seedAdmin({ name: "Other Staff Member" })
    const order = await seedOrder()
    const otherContent = `Other staff comment ${uniqueSuffix()}`

    await seedAdminOrderNote(order.id, otherAdmin.id, otherContent)

    await signIn(page, admin)
    await page.goto(`/orders/${order.id}`)

    const notesSection = page.locator("section", {
      hasText: "Internal Staff Notes",
    })
    const otherRow = notesSection.locator(".group", {
      hasText: otherContent,
    })

    await otherRow.hover()
    await expect(
      otherRow.getByRole("button", { name: "Edit note" })
    ).toHaveCount(0)
    await expect(
      otherRow.getByRole("button", { name: "Delete note" })
    ).toHaveCount(0)
  })
})
