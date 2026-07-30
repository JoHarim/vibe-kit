// 재료: Cloudflare — 배포 · 엣지 · 파일 저장(R2). (선택 재료 — 냉동칸)
// 전 세계에 빠르게 뿌리거나, 이미지·파일을 저장할 때 꺼낸다.
//
// 활성화 (쓸 때 한 줄):
//   배포 CLI:  pnpm add -g wrangler        → npx wrangler pages deploy
//   R2(파일):  S3 호환 API — 클로드에게 "R2에 이미지 업로드 붙여줘" 하면 됨
// 키는 .env (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN).

export const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
export const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN ?? "";

export function hasCloudflareConfig(): boolean {
  return CF_ACCOUNT_ID.length > 5 && !CF_ACCOUNT_ID.startsWith("dummy");
}
