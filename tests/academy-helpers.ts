import { expect, type Page } from "@playwright/test";

const examAnswers: [string, string][] = [
  ["Which goal gives you the clearest way", "Host one listening circle with five peers by the end of the month"],
  ["concrete example of when you helped", "To compare outside evidence with your own reflection"],
  ["Your listening circle drew only two", "Ask what would make it easier to attend and adjust the plan"],
  ["best describes a leadership value", "A principle that guides how you act"],
  ["makes a plan realistic", "It is small, specific, and has a date to review it"],
  ["Which behaviour shows self-awareness", "Noticing how your tone affects a discussion"],
];
async function answer(page: Page, pairs: [string, string][], submit: string) {
  await page.getByRole("dialog").getByRole("button", { name: "Turn on camera & start" }).click();
  for (const [q, a] of pairs) await page.locator("fieldset", { hasText: q }).getByLabel(a, { exact: true }).check();
  await page.getByRole("button", { name: submit }).click();
}
/** Completes Personal Leadership through its graded assessments only. */
export async function finishPersonalLeadership(page: Page) {
  await page.goto("/academy/personal-leadership");
  await page.getByRole("button", { name: /Enroll in this course/ }).first().click();
  await page.getByRole("button", { name: /Go to knowledge check/ }).click();
  await page.getByRole("button", { name: /Start quiz/ }).click();
  await answer(page, [["Where does leadership begin", "With understanding how your actions affect others"], ["A friend gives you feedback", "Listen without defending yourself"], ["Which combination", "A strength, a value, and an area to improve"]], "Submit quiz");
  await expect(page.getByText(/Latest attempt: 100%/)).toBeVisible();
  await page.getByRole("button", { name: /Turn purpose into a plan/ }).click();
  await page.getByRole("button", { name: /Go to knowledge check/ }).click();
  await page.getByRole("button", { name: /Start quiz/ }).click();
  await answer(page, [["Which of these is a measurable result", "Invite five classmates to a listening circle this month"], ["What three parts make a purpose", "A specific action, a measurable result, and a review date"], ["After trying your action", "Review what worked and adjust your next step"]], "Submit quiz");
  await expect(page.getByText(/Latest attempt: 100%/)).toBeVisible();
  await page.getByRole("button", { name: /Graded assignment/ }).click();
  await page.getByLabel("Your response").fill("My strength is listening carefully to classmates when they feel ignored. ".repeat(6) + "This month I will host one listening circle with five peers and record their suggestions.");
  await page.getByRole("button", { name: "Submit assignment" }).click();
  await page.getByRole("button", { name: /Start exam/ }).click();
  await answer(page, examAnswers, "Submit exam");
  await expect(page.getByRole("heading", { name: "You earned it." })).toBeVisible();
}
