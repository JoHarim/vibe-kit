#!/usr/bin/env node
// 훅 ④ 진행상황 progress.html (Stop · 응답 끝날 때마다)
// 프로젝트 루트 plan.md 의 체크리스트(- [x] / - [ ])를 읽어 progress.html 을 만든다.
// 학생이 코드를 못 읽어도 완료/남음으로 자기 위치를 안다. 관제화면의 학생 데이터 소스.
//
// 보안: .env 는 절대 읽지 않음. 추출 텍스트에 키 패턴이 섞이면 마스킹.
// Fail-open: 에러 시 조용히 통과. 변화 없으면 재작성 안 함(낭비 방지).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

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
  let root = input?.cwd ?? "";
  if (root === "") process.exit(0);

  // plan.md 찾기 (cwd 부터 상위로)
  while (root !== "/" && !existsSync(join(root, "plan.md"))) root = dirname(root);
  const planPath = join(root, "plan.md");
  if (!existsSync(planPath)) process.exit(0);

  // 체크리스트 라인만 추출 + 민감정보 마스킹
  const mask = (s) =>
    s
      .replace(/sk-[A-Za-z0-9_-]+/g, "*****")
      .replace(/[A-Za-z0-9_.-]*(KEY|SECRET|TOKEN|PASSWORD)[A-Za-z0-9_.-]*=?\S*/gi, "*****");
  const lines = readFileSync(planPath, "utf8")
    .split("\n")
    .filter((l) => /^\s*- \[[ xX]\]/.test(l))
    .map(mask);
  if (lines.length === 0) process.exit(0);

  const done = lines.filter((l) => /^\s*- \[[xX]\]/.test(l)).length;
  const total = lines.length;
  const pct = total > 0 ? Math.round((done * 100) / total) : 0;

  // 변화 없으면 skip (진행률 스냅샷 비교)
  const snap = `${done}/${total}`;
  const snapFile = join(root, ".progress-snap");
  if (existsSync(snapFile) && readFileSync(snapFile, "utf8") === snap) process.exit(0);
  writeFileSync(snapFile, snap);

  let next = "";
  const items = lines
    .map((l) => {
      const txt = l.replace(/^\s*- \[[ xX]\]\s*/, "");
      const isDone = /^\s*- \[[xX]\]/.test(l);
      if (!isDone && next === "") next = txt;
      return isDone ? `<li class="done">✓ ${txt}</li>` : `<li>○ ${txt}</li>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">
<meta http-equiv="refresh" content="5">
<title>진행 상황</title><style>
body{margin:0;background:#0a0a0b;color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,"Pretendard",sans-serif;padding:28px}
h1{font-size:20px;margin:0 0 4px}.pct{color:#a1a1aa;font-size:14px;margin-bottom:16px}
.bar{height:12px;background:#161618;border-radius:99px;overflow:hidden;margin-bottom:18px}
.bar i{display:block;height:100%;background:#f4f4f5;width:${pct}%}
ul{list-style:none;padding:0;margin:0;font-size:15px;line-height:2}
li{color:#71717a}li.done{color:#f4f4f5}
.next{margin-top:16px;color:#a1a1aa;font-size:14px}.next b{color:#f4f4f5}
</style></head><body>
<h1>진행 상황 · ${done}/${total}</h1><div class="pct">${pct}%</div>
<div class="bar"><i></i></div>
<ul>${items}</ul>
<div class="next">다음 ▸ <b>${next !== "" ? next : "없음 — 다 끝!"}</b></div>
</body></html>
`;
  writeFileSync(join(root, "progress.html"), html);
} catch {
  // fail-open
}
process.exit(0);
