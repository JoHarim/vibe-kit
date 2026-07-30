#!/usr/bin/env node
// 훅 ② 컴퓨터 용어 풀어서 설명 강제 (UserPromptSubmit)
// 매 프롬프트마다 "전문용어는 비유로 풀어라"를 컨텍스트에 주입.
// profile.md 가 채워져 있으면 그 사람의 직업·코딩 수준을 같이 실어 "그 업계 언어"로 풀게 한다.
// CLAUDE.md 가 '부탁'이라면, 이 훅은 매번 '리마인드'를 최근 위치에 꽂아 준수율을 높인다.
//
// UserPromptSubmit 훅은 stdout 이 그대로 컨텍스트에 주입된다.
// Fail-open: profile.md 가 없거나 못 읽으면 기본 문구만. 항상 exit 0.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

let who = "";
try {
  const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const p = join(root, "profile.md");
  if (existsSync(p)) {
    const t = readFileSync(p, "utf8");
    const pick = (label) => {
      const m = t.match(new RegExp("- " + label + "[^:]*:\\s*(.+)"));
      const v = m === null ? "" : m[1].trim();
      return v.startsWith("[") ? "" : v; // 견본 그대로면 무시
    };
    const job = pick("직업");
    const level = pick("코딩 수준");
    if (job !== "" || level !== "") {
      who =
        "\n- 이 사용자: " +
        (job === "" ? "" : "직업·분야 = " + job + " · ") +
        (level === "" ? "" : "코딩 수준 = " + level) +
        "\n- 비유는 일반 비유보다 **이 사용자의 업계·일상 언어**로 먼저 풀어라 (예: 이커머스면 DB=상품 재고 장부, API=도매처 발주 전화, 배포=매장 오픈). 코딩 수준이 낮을수록 개발 용어 자체를 줄이고, 써야 하면 괄호 한 줄 비유를 붙여라.";
    }
  }
} catch {}

console.log(`[강의 모드 — 비개발자 수강생]
- 전문용어(API·DB·환경변수·배포·커밋·서버·프론트/백 등)가 나오면 그 자리에서 한 줄 비유로 풀어라.
- 코드를 보여주기 전에 "이게 무슨 일을 하는지" 한국어 1~2줄을 먼저 말하라.
- "간단합니다 / 그냥 하면 됩니다" 로 뭉개지 말고, 왜 그런지 근거를 짧게 덧붙여라.${who}`);

process.exit(0);
