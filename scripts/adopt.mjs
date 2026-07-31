#!/usr/bin/env node
// vibe-kit adopt — "이미 진행 중인 프로젝트"에 밀키트 부품을 주입한다.
//
// 사용법:
//   node scripts/adopt.mjs --into /path/to/my-project
//   node scripts/adopt.mjs --into ../my-app --parts claude,agents,env,plan,integrations,e2e
//
// 옵션:
//   --parts  주입할 부품 (기본: claude,agents,env,plan / 추가 가능: integrations,e2e)
//   --dry    실제 복사 없이 뭘 할지 출력만
//   --force  기존 파일 덮어쓰기 (기본은 절대 덮지 않음)
//
// 안전 원칙:
//   - 대상 프로젝트의 .env 는 절대 건드리지 않는다.
//   - 기존 파일은 기본적으로 보존 (건너뛰고 알려줌).
//   - settings.json 은 통째로 덮지 않고 훅 항목만 병합한다.
//   - AGENTS.md 의 "이번 프로젝트" 섹션(그 프로젝트만의 예외·금지구역)은 --force 여도 절대 안 덮는다.
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ---------- 인자 파싱 ----------
const args = process.argv.slice(2);
function argValue(name) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] !== undefined ? args[i + 1] : null;
}
const into = argValue("--into");
const dry = args.includes("--dry");
const force = args.includes("--force");
const parts = (argValue("--parts") ?? "claude,agents,env,plan").split(",").map((s) => s.trim());

if (into === null) {
  console.log("사용법: node scripts/adopt.mjs --into <내 프로젝트 경로> [--parts claude,agents,env,plan,integrations,e2e] [--dry] [--force]");
  process.exit(1);
}
const TARGET = resolve(into);
if (!existsSync(TARGET) || !statSync(TARGET).isDirectory()) {
  console.error(`[중단] 대상 폴더가 없습니다: ${TARGET}`);
  process.exit(1);
}
if (TARGET === KIT || TARGET.startsWith(KIT + "/")) {
  console.error("[중단] vibe-kit 자기 자신에는 adopt 할 수 없습니다.");
  process.exit(1);
}

// ---------- 헬퍼 ----------
const actions = [];
function log(tag, msg) {
  actions.push(`[${tag}] ${msg}`);
  console.log(`[${tag}] ${msg}`);
}
function copyFile(src, dst) {
  if (!existsSync(src)) return;
  if (existsSync(dst) && !force) {
    log("건너뜀", `${dst} (이미 있음 — 덮으려면 --force)`);
    return;
  }
  if (!dry) {
    mkdirSync(dirname(dst), { recursive: true });
    cpSync(src, dst);
  }
  log(dry ? "예정" : "복사", dst);
}
function copyDir(srcDir, dstDir) {
  if (!existsSync(srcDir)) return;
  for (const name of readdirSync(srcDir)) {
    const s = join(srcDir, name);
    const d = join(dstDir, name);
    if (statSync(s).isDirectory()) copyDir(s, d);
    else copyFile(s, d);
  }
}

// ---------- 부품: claude (훅 + 스킬 + 서브에이전트 + CLAUDE.md + settings 병합) ----------
function adoptClaude() {
  // 훅 스크립트
  copyDir(join(KIT, ".claude", "hooks"), join(TARGET, ".claude", "hooks"));
  // 스킬 (blueprint 등)
  copyDir(join(KIT, ".claude", "skills"), join(TARGET, ".claude", "skills"));
  // 서브에이전트 (security-reviewer · code-reviewer)
  copyDir(join(KIT, ".claude", "agents"), join(TARGET, ".claude", "agents"));
  // CLAUDE.md — 대상에 이미 있으면 절대 안 건드림 (프로젝트 정체성 존중)
  const targetClaudeMd = existsSync(join(TARGET, "CLAUDE.md")) || existsSync(join(TARGET, ".claude", "CLAUDE.md"));
  if (targetClaudeMd) {
    log("건너뜀", "CLAUDE.md (대상에 이미 있음 — vibe-kit 규칙이 필요하면 수동으로 발췌)");
  } else {
    copyFile(join(KIT, ".claude", "CLAUDE.md"), join(TARGET, ".claude", "CLAUDE.md"));
  }
  // settings.json 병합
  const srcPath = join(KIT, ".claude", "settings.json");
  const dstPath = join(TARGET, ".claude", "settings.json");
  if (!existsSync(dstPath)) {
    copyFile(srcPath, dstPath);
    return;
  }
  try {
    const src = JSON.parse(readFileSync(srcPath, "utf8"));
    const dst = JSON.parse(readFileSync(dstPath, "utf8"));
    dst.hooks = dst.hooks ?? {};
    let added = 0;
    for (const [event, srcGroups] of Object.entries(src.hooks ?? {})) {
      dst.hooks[event] = dst.hooks[event] ?? [];
      for (const srcGroup of srcGroups) {
        const key = srcGroup.matcher ?? "";
        let dstGroup = dst.hooks[event].find((g) => (g.matcher ?? "") === key);
        if (dstGroup === undefined) {
          dst.hooks[event].push(srcGroup);
          added += srcGroup.hooks.length;
          continue;
        }
        for (const h of srcGroup.hooks) {
          const exists = dstGroup.hooks.some((eh) => eh.command === h.command);
          if (!exists) {
            dstGroup.hooks.push(h);
            added += 1;
          }
        }
      }
    }
    if (added > 0) {
      if (!dry) writeFileSync(dstPath, JSON.stringify(dst, null, 2) + "\n");
      log(dry ? "예정" : "병합", `${dstPath} (훅 ${added}개 추가)`);
    } else {
      log("건너뜀", `${dstPath} (추가할 훅 없음)`);
    }
  } catch {
    // 병합 실패 시 원본을 옆에 두고 사람이 합치게 한다 (안전)
    copyFile(srcPath, join(TARGET, ".claude", "settings.vibe-kit.json"));
    log("주의", "settings.json 파싱 실패 → settings.vibe-kit.json 으로 두었음. 수동으로 합쳐주세요.");
  }
}

// ---------- 부품: env (.env.example 키 병합 — .env 는 절대 안 건드림) ----------
function adoptEnv() {
  const srcPath = join(KIT, ".env.example");
  const dstPath = join(TARGET, ".env.example");
  if (!existsSync(dstPath)) {
    copyFile(srcPath, dstPath);
    return;
  }
  const keyOf = (line) => {
    const m = line.match(/^([A-Z][A-Z0-9_]*)=/);
    return m !== null ? m[1] : null;
  };
  const dstText = readFileSync(dstPath, "utf8");
  const dstKeys = new Set(dstText.split("\n").map(keyOf).filter((k) => k !== null));
  const missing = readFileSync(srcPath, "utf8")
    .split("\n")
    .filter((line) => {
      const k = keyOf(line);
      return k !== null && !dstKeys.has(k);
    });
  if (missing.length === 0) {
    log("건너뜀", `${dstPath} (추가할 키 없음)`);
    return;
  }
  if (!dry) {
    writeFileSync(dstPath, dstText.trimEnd() + "\n\n# --- vibe-kit adopt 가 추가한 키 ---\n" + missing.join("\n") + "\n");
  }
  log(dry ? "예정" : "병합", `${dstPath} (키 ${missing.length}개 추가)`);
}

// ---------- 부품: plan (기획서 템플릿) ----------
function adoptPlan() {
  copyFile(join(KIT, "plan.md"), join(TARGET, "plan.md"));
}

// ---------- 부품: agents (구현 AI 규칙 — AGENTS.md) ----------
//
// AGENTS.md 는 Codex CLI 등 구현 AI 가 저장소 루트에서 자동으로 읽는 파일이다.
// 이 파일의 "## 이번 프로젝트" 섹션에는 그 프로젝트에만 해당하는 예외·금지구역·게이트가 적히는데,
// 킷이 그걸 알 방법이 없다. 그래서 **그 섹션은 어떤 경우에도 덮어쓰지 않는다** —
// 날아가면 구현 AI 가 예외를 모른 채 규칙을 곧이곧대로 적용해 멀쩡한 기능을 되돌린다
// (2026-07 사주 플래너: 킷의 NEXT_PUBLIC_ 금지를 그대로 적용했다면 로그인이 죽을 뻔했다).

const PROJECT_HEADING = "## 이번 프로젝트";

/** 마크다운에서 특정 `## ` 섹션(다음 `## ` 직전까지)을 잘라낸다. 없으면 null. */
function sliceSection(text, headingPrefix) {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.startsWith(headingPrefix));
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (lines[i].startsWith("## ")) {
      end = i;
      break;
    }
  }
  return { start, end, text: lines.slice(start, end).join("\n").trimEnd() };
}

/** 킷 본문의 "이번 프로젝트" 섹션을 대상 것으로 갈아끼운다. 못 찾으면 null. */
function mergeKeepingProjectSection(kitText, dstText) {
  const kitSec = sliceSection(kitText, PROJECT_HEADING);
  const dstSec = sliceSection(dstText, PROJECT_HEADING);
  if (kitSec === null || dstSec === null) return null;
  const lines = kitText.split("\n");
  return [
    ...lines.slice(0, kitSec.start),
    dstSec.text,
    "",
    ...lines.slice(kitSec.end),
  ].join("\n");
}

function adoptAgents() {
  const srcPath = join(KIT, "AGENTS.md");
  const dstPath = join(TARGET, "AGENTS.md");

  if (!existsSync(srcPath)) {
    log("주의", "킷에 AGENTS.md 가 없습니다 — 건너뜁니다.");
    return;
  }
  if (!existsSync(dstPath)) {
    copyFile(srcPath, dstPath);
    log("안내", "AGENTS.md 의 '이번 프로젝트' 섹션을 이 프로젝트에 맞게 채우세요(구조·예외·금지구역·게이트).");
    return;
  }

  const kitText = readFileSync(srcPath, "utf8");
  const dstText = readFileSync(dstPath, "utf8");

  if (!force) {
    // 기본은 보존 — 킷 최신본을 옆에 두고 사람이 합치게 한다(settings 와 같은 방식).
    const sidePath = join(TARGET, "AGENTS.vibe-kit.md");
    if (!dry) writeFileSync(sidePath, kitText);
    log(dry ? "예정" : "복사", `${sidePath} (대상 AGENTS.md 는 보존)`);
    log("주의", "AGENTS.md 가 이미 있어 덮지 않았습니다. 킷 최신 규칙은 AGENTS.vibe-kit.md 를 보고 합치거나, --force 로 '이번 프로젝트' 섹션만 지킨 채 갱신하세요.");
    return;
  }

  // --force 여도 통째 덮기는 하지 않는다 — 프로젝트 섹션만은 반드시 지킨다.
  const merged = mergeKeepingProjectSection(kitText, dstText);
  if (merged === null) {
    log("주의", `${dstPath} 에 '${PROJECT_HEADING}' 섹션이 없어 자동 병합을 포기했습니다(덮지 않음). 수동으로 합쳐주세요.`);
    return;
  }
  if (merged === dstText) {
    log("건너뜀", `${dstPath} (이미 최신)`);
    return;
  }
  if (!dry) writeFileSync(dstPath, merged);
  log(dry ? "예정" : "병합", `${dstPath} (킷 일반규칙 갱신 · '이번 프로젝트' 섹션은 그대로 보존)`);
  log("주의", "'이번 프로젝트' 섹션 **밖**에 적어둔 프로젝트 고유 내용은 킷 최신본으로 교체됩니다. 살려야 할 내용은 그 섹션 안으로 옮겨두세요.");
}

// ---------- 부품: integrations (재료 코드 → lib/integrations/) ----------
function adoptIntegrations() {
  const base = join(KIT, "packages", "integrations");
  for (const name of readdirSync(base)) {
    const idx = join(base, name, "index.ts");
    if (existsSync(idx)) copyFile(idx, join(TARGET, "lib", "integrations", `${name}.ts`));
  }
  log("안내", "재료가 lib/integrations/ 에 들어갔습니다. 쓰는 재료의 패키지를 설치하세요:");
  log("안내", "  supabase → npm i @supabase/supabase-js   |   ai → npm i @anthropic-ai/sdk");
}

// ---------- 부품: e2e (Playwright 자동 손님) ----------
function adoptE2e() {
  copyDir(join(KIT, "e2e"), join(TARGET, "e2e"));
  log("안내", "e2e 설치: npm i -D @playwright/test && npx playwright install chromium");
}

// ---------- 실행 ----------
console.log(`vibe-kit adopt ${dry ? "(dry-run — 출력만)" : ""}`);
console.log(`  키트: ${KIT}`);
console.log(`  대상: ${TARGET}`);
console.log(`  부품: ${parts.join(", ")}\n`);

const runners = { claude: adoptClaude, agents: adoptAgents, env: adoptEnv, plan: adoptPlan, integrations: adoptIntegrations, e2e: adoptE2e };
for (const p of parts) {
  const run = runners[p];
  if (run === undefined) {
    console.error(`[주의] 모르는 부품: ${p} (가능: ${Object.keys(runners).join(", ")})`);
    continue;
  }
  console.log(`\n── ${p} ──`);
  run();
}

console.log(`\n완료. ${dry ? "실제로 적용하려면 --dry 를 빼고 다시 실행." : "이제 클로드 코드를 켜고 \"plan.md 대로 진행하자\" 하면 됩니다."}`);
