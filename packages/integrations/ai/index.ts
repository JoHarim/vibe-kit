// 재료: AI — 두뇌를 빌린다 (문구·요약·분류·아이디어). 쓴 만큼 과금. 키는 .env.
// ⚠️ 서버에서만 import 할 것 (Route Handler / Server Action). 브라우저에 키가 새면 안 된다.
import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY ?? "";

/** 키가 진짜로 채워졌는지 (빈값·더미면 false) */
export function hasAIConfig(): boolean {
  return apiKey.length > 10 && !apiKey.startsWith("dummy");
}

let _ai: Anthropic | null = null;

/** Anthropic 클라이언트. 키가 없으면 어디를 채울지 한국어로 알려주고 멈춘다. */
export function getAI(): Anthropic {
  if (!hasAIConfig()) {
    throw new Error(
      "[vibe-kit] AI 키가 아직 없습니다. .env 의 ANTHROPIC_API_KEY 를 채워주세요. 발급: console.anthropic.com → API Keys (.env.example 에 자리 있음)"
    );
  }
  if (_ai === null) {
    _ai = new Anthropic({ apiKey });
  }
  return _ai;
}

/**
 * 제일 자주 쓰는 형태: 질문 한 번 → 답 텍스트 한 번.
 * 예) const 제목 = await generateText("방명록 환영 문구 5개 뽑아줘");
 */
export async function generateText(
  prompt: string,
  model: string = "claude-sonnet-5"
): Promise<string> {
  const res = await getAI().messages.create({
    model,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  const first = res.content[0];
  return first !== undefined && first.type === "text" ? first.text : "";
}
