#!/usr/bin/env node
// 훅 ⑥ 설계 승인 게이트 (PreToolUse · Write/Edit 직전)
// 무엇: plan.md(기획)가 아직 견본 그대로면 apps/ 아래 "제품 코드" 작성을 차단한다.
// 왜 훅인가: "기획 없이 코드부터 금지"는 스킬(부탁)로는 새기 마련이다 — handoff 처럼
//       '반드시 일어나야 하는 것'이라 훅(강제)으로 건다. 기획 인터뷰(blueprint)의 물리적 강제 장치.
// 통과 조건: plan.md 의 ① 한 문장 소개가 채워짐(견본 [누구] 아님) ② 조립 순서 체크박스 1개 이상.
// 게이트 밖(항상 허용): apps/ 밖 전부(문서·기획·재료 설정) · apps/ 안 .md 문서.
// 끄는 법: plan.md 아무 곳에 `plan-gate: off` 한 줄 (사용자가 결정할 일).
// Fail-open: 판정 불가·에러면 조용히 통과.
import { existsSync, readFileSync } from "node:fs";
import { join, relative, isAbsolute } from "node:path";

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", () => resolve(""));
  });
}

try {
  const input = JSON.parse((await readStdin()) || "{}");
  const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const fp = input?.tool_input?.file_path;
  if (typeof fp !== "string" || fp === "") process.exit(0);

  const rel = isAbsolute(fp) ? relative(root, fp) : fp;
  if (rel.startsWith("..")) process.exit(0); // 프로젝트 밖 — 관여하지 않는다
  const inApps = rel === "apps" || rel.startsWith("apps/") || rel.includes("/apps/");
  if (inApps === false) process.exit(0); // 제품 코드(apps/)만 게이트
  if (rel.endsWith(".md")) process.exit(0); // 문서는 허용

  const planPath = join(root, "plan.md");
  let blockedWhy = "";
  if (existsSync(planPath) === false) {
    blockedWhy = "plan.md 가 없다";
  } else {
    const plan = readFileSync(planPath, "utf8");
    if (plan.includes("plan-gate: off")) process.exit(0);
    const introFilled = plan.includes("[누구]") === false;
    const hasStep = /-\s\[[ xX]\]/.test(plan);
    if (introFilled && hasStep) process.exit(0); // 기획 있음 — 문이 열린다
    blockedWhy = introFilled
      ? "plan.md 에 조립 순서(스텝 체크박스)가 없다"
      : "plan.md 의 '한 문장 소개'가 아직 견본([누구]...) 그대로다";
  }

  process.stderr.write(
    `[설계 승인 게이트] 앱 코드 작성이 차단됐다 — ${blockedWhy}.\n` +
      "기획 없이 코드를 쓰면 나중에 전부 엎는다. 지금 할 일:\n" +
      "1. 사용자에게 '기획하자'(blueprint 인터뷰)를 권해 기획부터 채워라.\n" +
      "2. plan.md 의 ① 한 문장 소개 ② 조립 순서(블럭·스텝 체크박스)가 채워지면 이 문은 자동으로 열린다.\n" +
      "3. 사용자가 그래도 기획 없이 가겠다고 하면: plan.md 에 `plan-gate: off` 한 줄을 사용자 승인 하에 추가하라 (권장하지 않는다고 한 번은 말하라).\n"
  );
  process.exit(2);
} catch {
  process.exit(0); // fail-open
}
