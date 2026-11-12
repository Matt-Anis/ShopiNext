import {
  test,
  expect,
  type APIRequestContext,
  type Route,
} from "@playwright/test"
import { signIn } from "../../utils/auth"
import {
  createCustomerSession,
  readCustomerSession,
  snapshotCustomerSession,
} from "../../utils/customer-session"
import { clickUntilHydrated } from "../../utils/interaction"
import { seedUser } from "../../utils/seed-user"
import { uniqueNameSuffix } from "../../utils/unique"

const firefoxUserAgent =
  "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0"

test("shows device details, rejects another customer's session, and signs out only the selected device", async ({
  page,
  request,
  baseURL,
}) => {
  test.slow()

  const customer = await seedUser(request, {
    name: `SD ${uniqueNameSuffix()}`,
    email: "session-device@example.com",
  })
  const otherCustomer = await seedUser(request, {
    name: `SO ${uniqueNameSuffix()}`,
    email: "session-other@example.com",
  })
  await signIn(page, customer)
  const current = await readCustomerSession(page.request)
  expect(current?.user.email).toBe(customer.email)

  const contexts: APIRequestContext[] = []
  try {
    const originalSession = await snapshotCustomerSession(page, baseURL!)
    contexts.push(originalSession)
    const selectedSession = await createCustomerSession(
      baseURL!,
      customer,
      firefoxUserAgent
    )
    contexts.push(selectedSession)
    const foreignSession = await createCustomerSession(baseURL!, otherCustomer)
    contexts.push(foreignSession)
    const selected = await readCustomerSession(selectedSession)
    const foreign = await readCustomerSession(foreignSession)
    expect(selected?.user.email).toBe(customer.email)
    expect(foreign?.user.email).toBe(otherCustomer.email)
    expect(selected?.session.id).not.toBe(current?.session.id)

    await page.goto("/profile/settings")
    const devicesCard = page.getByRole("main").locator("[data-slot='card']", {
      has: page.getByRole("heading", {
        name: "Signed-in devices",
        exact: true,
      }),
    })
    const currentRow = devicesCard
      .getByRole("listitem")
      .filter({ hasText: "This device" })
    await expect(currentRow).toBeVisible()
    await expect(currentRow.locator("time")).toHaveAttribute(
      "datetime",
      current!.session.createdAt
    )
    await expect(
      currentRow.getByRole("button", {
        name: "Sign out this device",
        exact: true,
      })
    ).toBeVisible()

    const selectedRow = devicesCard
      .getByRole("listitem")
      .filter({ hasText: "Firefox on Linux" })
    const signOutButton = selectedRow.getByRole("button", {
      name: "Sign out Firefox on Linux",
      exact: true,
    })
    await expect(selectedRow.locator("time")).toHaveAttribute(
      "datetime",
      selected!.session.createdAt
    )

    let substituted = false
    const substituteTarget = async (route: Route) => {
      const actionRequest = route.request()
      if (
        actionRequest.method() !== "POST" ||
        !actionRequest.headers()["next-action"]
      ) {
        await route.continue()
        return
      }

      const postData = actionRequest.postData()
      expect(postData).toContain(JSON.stringify(selected!.session.id))
      substituted = true
      await route.continue({
        postData: postData!.replace(
          JSON.stringify(selected!.session.id),
          JSON.stringify(foreign!.session.id)
        ),
      })
    }
    await page.route("**/profile/settings", substituteTarget)
    try {
      await clickUntilHydrated(signOutButton, () =>
        expect(selectedRow.getByRole("alert")).toHaveText(
          "This sign-in has already ended. Refresh the page to update your devices."
        )
      )
      expect(substituted).toBe(true)
      await expect(selectedRow).toBeVisible()
      await expect
        .poll(() => readCustomerSession(foreignSession))
        .toMatchObject({
          session: { id: foreign?.session.id },
          user: { email: otherCustomer.email },
        })
      await expect
        .poll(() => readCustomerSession(selectedSession))
        .toMatchObject({
          session: { id: selected?.session.id },
        })
    } finally {
      await page.unroute("**/profile/settings", substituteTarget)
    }

    await clickUntilHydrated(signOutButton, () =>
      expect(page.getByText("Device signed out", { exact: true })).toBeVisible()
    )
    await expect(selectedRow).toBeHidden()
    await expect.poll(() => readCustomerSession(selectedSession)).toBeNull()
    await expect
      .poll(() => readCustomerSession(originalSession))
      .toMatchObject({
        session: { id: current?.session.id },
        user: { email: customer.email },
      })
    await expect
      .poll(() => readCustomerSession(foreignSession))
      .toMatchObject({
        session: { id: foreign?.session.id },
        user: { email: otherCustomer.email },
      })
    await expect(currentRow).toBeVisible()
  } finally {
    await Promise.all(contexts.map((context) => context.dispose()))
  }
})

test("signs out every customer session only after confirmation and leaves another customer signed in", async ({
  page,
  request,
  baseURL,
}) => {
  test.slow()

  const customer = await seedUser(request, {
    name: `SA ${uniqueNameSuffix()}`,
    email: "session-all@example.com",
  })
  const otherCustomer = await seedUser(request, {
    name: `SX ${uniqueNameSuffix()}`,
    email: "session-all-other@example.com",
  })
  await signIn(page, customer)
  const current = await readCustomerSession(page.request)
  expect(current?.user.email).toBe(customer.email)

  const contexts: APIRequestContext[] = []
  try {
    const originalSession = await snapshotCustomerSession(page, baseURL!)
    contexts.push(originalSession)
    const secondSession = await createCustomerSession(
      baseURL!,
      customer,
      firefoxUserAgent
    )
    contexts.push(secondSession)
    const foreignSession = await createCustomerSession(baseURL!, otherCustomer)
    contexts.push(foreignSession)
    const second = await readCustomerSession(secondSession)
    const foreign = await readCustomerSession(foreignSession)
    expect(second?.user.email).toBe(customer.email)
    expect(foreign?.user.email).toBe(otherCustomer.email)
    expect(second?.session.id).not.toBe(current?.session.id)

    await page.goto("/profile/settings")
    const devicesCard = page.getByRole("main").locator("[data-slot='card']", {
      has: page.getByRole("heading", {
        name: "Signed-in devices",
        exact: true,
      }),
    })
    const signOutAll = devicesCard.getByRole("button", {
      name: "Sign out all devices",
      exact: true,
    })
    const dialog = page.getByRole("alertdialog", {
      name: "Sign out all devices?",
    })
    await clickUntilHydrated(signOutAll, () => expect(dialog).toBeVisible())
    await expect(dialog).toContainText("including this one")
    await clickUntilHydrated(
      dialog.getByRole("button", { name: "Cancel", exact: true }),
      () => expect(dialog).toBeHidden()
    )

    await expect
      .poll(() => readCustomerSession(originalSession))
      .toMatchObject({
        session: { id: current?.session.id },
      })
    await expect
      .poll(() => readCustomerSession(secondSession))
      .toMatchObject({
        session: { id: second?.session.id },
      })
    await expect
      .poll(() => readCustomerSession(foreignSession))
      .toMatchObject({
        session: { id: foreign?.session.id },
      })

    await clickUntilHydrated(signOutAll, () => expect(dialog).toBeVisible())
    await clickUntilHydrated(
      dialog.getByRole("button", { name: "Sign out all devices", exact: true }),
      () => expect(page).toHaveURL("/login")
    )
    await expect(page.getByTestId("login-form")).toBeVisible()

    await expect.poll(() => readCustomerSession(originalSession)).toBeNull()
    await expect.poll(() => readCustomerSession(secondSession)).toBeNull()
    await expect
      .poll(() => readCustomerSession(foreignSession))
      .toMatchObject({
        session: { id: foreign?.session.id },
        user: { email: otherCustomer.email },
      })
  } finally {
    await Promise.all(contexts.map((context) => context.dispose()))
  }
})
