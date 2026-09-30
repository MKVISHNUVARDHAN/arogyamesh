import { test, expect } from "@playwright/test";
test("judge flow: forecast, twin, safe plan, emergency, federation, offline synchronization", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await request.post("/api/demo/reset", {
    headers: { "X-Demo-Role": "district" },
  });
  await page.goto("/command-center");
  await expect(page.getByText("Current stock appears healthy")).toBeVisible();
  await page.getByRole("button", { name: "+5 days", exact: true }).click();
  await expect(page.getByText("+5 day outlook")).toBeVisible();
  await page.getByRole("link", { name: "Open digital twin" }).click();
  await expect(
    page.getByRole("heading", { name: "Can we trust this stock?" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Find safe redistribution" }).click();
  await page.getByRole("button", { name: "Find safe redistribution" }).click();
  await expect(
    page.getByRole("heading", { name: "Safe transfer plan" }),
  ).toBeVisible();
  await expect(page.getByText("Cross-district", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Approve plan" }).click();
  await expect(
    page.getByRole("button", { name: "Simulate dispatch" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Emergency simulator", exact: true })
    .click();
  await page.getByRole("button", { name: "Run scenario" }).click();
  await page.getByRole("button", { name: "Optimize response" }).click();
  await expect(
    page.getByText("Medicine failures after", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Federated intelligence", exact: true })
    .click();
  await page.getByRole("button", { name: "Train federated round" }).click();
  await expect(page.getByText("Trained locally", { exact: true })).toHaveCount(
    3,
  );
  await page.getByRole("link", { name: "PHC operations", exact: true }).click();
  await expect(page.getByTestId("local-stock")).toContainText("800");
  await page.getByRole("button", { name: "Go offline (demo)" }).click();
  await page.getByRole("button", { name: "Record transaction" }).click();
  await expect(
    page.getByText("1 unsynced events", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("local-stock")).toContainText("750");
  await page.getByRole("button", { name: "Reconnect", exact: true }).click();
  await expect(
    page.getByText("0 unsynced events", { exact: true }),
  ).toBeVisible();
  const inventory = await (
    await request.get("/api/phcs/PHC-001/inventory")
  ).json();
  expect(
    inventory.find((x: { medicine_id: string }) => x.medicine_id === "ors")
      .recorded,
  ).toBe(750);
  expect(errors).toEqual([]);
});
test("operator survives actual offline reload and synchronizes persistent queue", async ({
  page,
  context,
}) => {
  await page.goto("/phc-mode");
  await expect(page.getByTestId("local-stock")).not.toContainText("—");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Record transaction" }),
  ).toBeEnabled();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Record transaction" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Record transaction" }).click();
  await expect(
    page.getByText("1 unsynced events", { exact: true }),
  ).toBeVisible();
  await context.setOffline(false);
  await expect(
    page.getByText("0 unsynced events", { exact: true }),
  ).toBeVisible();
});
test("diagnostic views, copilot fallback and mobile facility detail", async ({
  page,
}) => {
  await page.goto("/model-health");
  await expect(
    page.getByRole("heading", { name: "Evaluation & assumptions" }),
  ).toBeVisible();
  await page.goto("/alerts");
  await expect(page.getByText("Why this rank?").first()).toBeVisible();
  await page
    .getByRole("button", { name: "Arogya Copilot", exact: true })
    .click();
  await page.getByRole("button", { name: "Explain from evidence" }).click();
  await expect(
    page.getByText(/Source: deterministic evidence template/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close copilot" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/command-center");
  await expect(
    page.getByRole("link", { name: "Open digital twin" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open digital twin" }).click();
  await expect(
    page.getByRole("heading", { name: "Attendance → service capacity" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
