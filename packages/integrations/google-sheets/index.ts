// 재료: Google Sheets — 시트를 DB처럼 쓰기. (선택 재료 — 냉동칸, 비개발자 친화)
// 진짜 DB가 부담스러우면 익숙한 구글 시트를 저장소로. 소규모·내부용에 딱.
//
// 활성화 (쓸 때 한 줄):
//   pnpm --filter @vibe-kit/google-sheets add google-spreadsheet google-auth-library
//   그 다음 클로드에게 "구글시트 저장 붙여줘" — 서비스계정 키는 .env.
// 한계: 동시 수정·대량 데이터엔 약하다 → 커지면 Supabase 로 이사.

export const SHEET_ID = process.env.GOOGLE_SHEETS_ID ?? "";
export const SA_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "";

export function hasSheetsConfig(): boolean {
  return SHEET_ID.length > 5 && !SHEET_ID.startsWith("dummy");
}

// 예) 한 줄 추가:  await sheet.addRow({ 이름: name, 내용: body })
// 예) 전체 읽기:  const rows = await sheet.getRows()
