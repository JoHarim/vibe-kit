#!/usr/bin/env node
// 훅 ① 로컬호스트 자동 열기 (PostToolUse · matcher: Bash)
// dev 서버 기동 명령을 감지하면 브라우저로 localhost 를 자동으로 연다.
// "어디서 봐요?" 없이 첫 화면이 뜨게 하는 도파민 훅.
//
// 왜 node 인가: jq·python3 는 새 맥에 기본으로 없다. 클로드 코드를 깔았다면 node 는 반드시 있다.
// Fail-open: 무슨 일이 있어도 exit 0 (빌드/작업을 절대 막지 않음).
import { spawn } from "node:child_process";

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", () => resolve(""));
  });
}

try {
  const raw = await readStdin();
  const input = JSON.parse(raw);
  const cmd = input?.tool_input?.command ?? "";

  // dev 서버 기동 명령인가? (next/vite/astro/expo, npm|pnpm|yarn dev)
  if (/(npm|pnpm|yarn) (run )?dev|next dev|vite|astro dev|expo start/i.test(cmd)) {
    const portMatch = cmd.match(/--?port[= ]?([0-9]+)|-p[= ]?([0-9]+)/i);
    const port = portMatch !== null ? (portMatch[1] ?? portMatch[2]) : "3000";
    const url = `http://localhost:${port}`;
    // 맥=open · 윈도우=cmd /c start · 리눅스=xdg-open (수강생 노트북 3종 전부 대응)
    const openCmd =
      process.platform === "darwin"
        ? `spawn("open", ["${url}"], { stdio: "ignore", detached: true }).unref()`
        : process.platform === "win32"
          ? `spawn("cmd", ["/c", "start", "", "${url}"], { stdio: "ignore", detached: true }).unref()`
          : `spawn("xdg-open", ["${url}"], { stdio: "ignore", detached: true }).unref()`;

    // 서버가 뜰 때까지 기다렸다 여는 일은 분리된 자식 프로세스가 맡는다 (훅 자신은 즉시 반환)
    const waiter = `
(async () => {
  for (let i = 0; i < 20; i++) {
    try { await fetch("${url}"); break; } catch { await new Promise((r) => setTimeout(r, 1000)); }
  }
  const { spawn } = await import("node:child_process");
  ${openCmd};
})();
`;
    spawn(process.execPath, ["-e", waiter], { stdio: "ignore", detached: true }).unref();
  }
} catch {
  // fail-open
}
process.exit(0);
