// 샘플 테스트 = "자동 손님이 첫 화면을 열어본다"
// 클로드에게 "이 화면 테스트 만들어줘" 하면 이런 걸 자동으로 늘려준다.
import { test, expect } from "@playwright/test";

test("첫 화면이 뜬다", async ({ page }) => {
  await page.goto("/");
  // 화면에 'vibe-kit' 글자가 보이는지 자동 손님이 확인
  await expect(page.getByText("vibe-kit")).toBeVisible();
});

// 예) 폼 테스트 — 나중에 늘릴 수 있는 모양:
// test("카드 저장이 된다", async ({ page }) => {
//   await page.goto("/");
//   await page.getByLabel("제목").fill("첫 카드");
//   await page.getByRole("button", { name: "저장" }).click();
//   await expect(page.getByText("첫 카드")).toBeVisible();
// });
