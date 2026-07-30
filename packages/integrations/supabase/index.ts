// 재료: Supabase — DB(창고) + 로그인(경비실)을 빌린다. 제일 많이 쓰는 재료.
// 키는 항상 .env 에서 읽는다 (코드에 박지 않는다). 어떤 키가 필요한지는 .env.example 참고.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? "";
const anonKey = process.env.SUPABASE_ANON_KEY ?? "";

/** 키가 진짜로 채워졌는지 (빈값·더미면 false) */
export function hasSupabaseConfig(): boolean {
  return (
    url.startsWith("https://") &&
    !url.includes("your-project") &&
    anonKey.length > 20 &&
    !anonKey.startsWith("dummy")
  );
}

let _client: SupabaseClient | null = null;

/**
 * Supabase 클라이언트. 키가 없으면 "어디를 채워야 하는지" 한국어로 알려주고 멈춘다.
 * 예) 저장:   await getSupabase().from("guestbook").insert({ name, message })
 * 예) 조회:   const { data } = await getSupabase().from("guestbook").select()
 * 예) 로그인: await getSupabase().auth.signInWithOAuth({ provider: "google" })
 */
export function getSupabase(): SupabaseClient {
  if (!hasSupabaseConfig()) {
    throw new Error(
      "[vibe-kit] Supabase 키가 아직 없습니다. .env 의 SUPABASE_URL / SUPABASE_ANON_KEY 를 채워주세요. 발급: supabase.com → 내 프로젝트 → Settings → API (.env.example 에 자리 있음)"
    );
  }
  if (_client === null) {
    _client = createClient(url, anonKey);
  }
  return _client;
}

// ⚠️ SUPABASE_SERVICE_ROLE_KEY(권한 우회 마스터키)는 여기서 쓰지 않는다.
//    서버 전용이고, 일상 작업은 전부 anon 키 + RLS(행 단위 권한)로 한다.
