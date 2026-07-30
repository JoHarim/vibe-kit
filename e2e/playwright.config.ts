// Playwright = 자동 손님. 브라우저를 열어 사람처럼 클릭·입력하며 "진짜 되나" 확인한다.
// AI가 만든 걸 눈으로만 믿지 말고, 자동 손님에게 시켜본다.
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./",
  use: { baseURL: "http://localhost:3000" },
  // 웹앱을 자동으로 띄운 뒤 테스트 (선택)
  webServer: {
    command: "pnpm --filter @vibe-kit/web dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
});
