#!/usr/bin/env node
// vibe-kit setup — 바이브코딩에 필요한 도구(CLI)가 깔려 있는지 점검한다.
//
// 사용법:
//   node scripts/setup.mjs            ← 점검 + 설치 명령 안내 (아무것도 안 깜)
//   node scripts/setup.mjs --install  ← npm 계열(무해)만 자동 설치, brew 계열은 명령만 안내
import { spawnSync } from "node:child_process";

const install = process.argv.includes("--install");

function found(cmd) {
  const r = spawnSync("/bin/sh", ["-c", `command -v ${cmd}`], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : null;
}
function version(cmd, flag = "--version") {
  const r = spawnSync("/bin/sh", ["-c", `${cmd} ${flag} 2>/dev/null | head -1`], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : "";
}

const TOOLS = [
  { cmd: "node", why: "모든 것의 기반 (클로드 코드가 요구)", how: "https://nodejs.org LTS 설치", auto: null },
  { cmd: "pnpm", why: "이 밀키트의 패키지 매니저", how: "corepack enable && corepack prepare pnpm@9 --activate", auto: "corepack enable" },
  { cmd: "git", why: "버전 관리 + 깃허브", how: "xcode-select --install (맥) 또는 git-scm.com", auto: null },
  { cmd: "claude", why: "클로드 코드 본체", how: "npm i -g @anthropic-ai/claude-code", auto: "npm i -g @anthropic-ai/claude-code" },
  { cmd: "supabase", why: "DB 마이그레이션·로컬 개발 (선택)", how: "brew install supabase/tap/supabase", auto: null },
  { cmd: "vercel", why: "배포 CLI (선택 — 깃허브 연결이면 불필요)", how: "npm i -g vercel", auto: "npm i -g vercel" },
  { cmd: "gh", why: "깃허브 CLI (선택 — PR·레포 관리)", how: "brew install gh", auto: null },
];

console.log("vibe-kit 도구 점검\n");

// node 버전 체크 (>=20)
const nodeMajor = parseInt(process.versions.node.split(".")[0], 10);
if (nodeMajor < 20) {
  console.log(`[주의] node ${process.versions.node} — 20 이상을 권장합니다 (nodejs.org LTS).`);
}

const missing = [];
for (const t of TOOLS) {
  const path = found(t.cmd);
  if (path !== null) {
    console.log(`  [있음] ${t.cmd.padEnd(9)} ${version(t.cmd)}`);
  } else {
    console.log(`  [없음] ${t.cmd.padEnd(9)} — ${t.why}`);
    console.log(`         설치: ${t.how}`);
    missing.push(t);
  }
}

if (missing.length === 0) {
  console.log("\n전부 준비됨. pnpm install 후 pnpm dev 로 시작하세요.");
  process.exit(0);
}

if (install) {
  console.log("\n--install: npm/corepack 계열만 자동 설치합니다 (brew 계열은 직접).");
  for (const t of missing) {
    if (t.auto === null) {
      console.log(`  [수동] ${t.cmd}: ${t.how}`);
      continue;
    }
    console.log(`  [실행] ${t.auto}`);
    const r = spawnSync("/bin/sh", ["-c", t.auto], { stdio: "inherit" });
    console.log(r.status === 0 ? `  [완료] ${t.cmd}` : `  [실패] ${t.cmd} — 위 안내대로 직접 설치해주세요`);
  }
} else {
  console.log("\n자동 설치를 원하면: node scripts/setup.mjs --install");
}
