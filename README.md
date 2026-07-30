# vibe-kit — 하림의 바이브코딩 밀키트

> 재료는 다 깔려 있다. 당신은 **아이디어만 얹으면** 된다.
> 요리 밀키트처럼 — 손질된 재료(외부 서비스 연결)와 조리도구(설정·훅·기획 스킬)가 준비돼 있고, 당신은 조립만 한다.

## 시작하기 (권장 흐름)

### 1. 깃허브에서 "Use this template" 버튼 누르기
이 레포 위쪽의 초록 **Use this template** 버튼 → **Create a new repository**.
그러면 **내 계정 아래에, 내가 정한 이름으로** 새 레포가 생긴다.

> 왜 `git clone` 이 아니라 이 버튼인가: clone 은 남의 레포(이 밀키트)를 복사만 한다. 커밋 기록이 밀키트에 묶여 있고, 내가 밀어 넣을(push) 곳이 없다. **템플릿 버튼은 처음부터 "내 레포"를 만든다.** 그래서 오늘부터 짠 코드는 전부 내 것으로 쌓이고, 내가 push 할 수 있다.

### 2. VS Code 에서 받아오기 (명령어 타이핑 없음)
1. 만든 레포 페이지에서 초록 **Code** 버튼 → URL 복사.
2. VS Code 를 열고 `Cmd+Shift+P` → **Git: Clone** 검색 → URL 붙여넣기 → 저장할 폴더 선택.
3. "열까요?" 물으면 **열기**. 이제 내 프로젝트가 VS Code 에 들어왔다.

> **Git: Clone** = VS Code 안에 내장된 기능이다. 터미널에 명령어를 칠 필요 없이, 팔레트(`Cmd+Shift+P`)에서 골라 쓰는 "받아오기 버튼"이라고 보면 된다.

### 3. Claude Code 패널에서 시작
1. VS Code 우측의 **Claude Code 패널**(사이드바 채팅창)을 연다.
2. 첫 채팅: **"기획하자"** → blueprint 스킬이 질문 카드로 설계도를 뽑아준다.
3. 다음: **"plan.md 대로 첫 블럭 만들어줘"** → 클로드가 코드를 제안하고, 패널에서 **diff(바뀐 부분)를 보고 승인**하면 반영된다.

> **Claude Code 패널** = VS Code 사이드바의 채팅창이다. 여기서 대화하고, 클로드가 고친 부분을 승인한다.
> [주의] "에이전트뷰"(claude agents)와 헷갈리지 말 것. 그건 백그라운드 세션들을 한눈에 보는 **관제탑**으로, 지금 쓰는 채팅 패널과는 다른 화면이다.

### (부록) 터미널이 편하면
버튼 대신 명령어로도 같은 걸 만들 수 있다:
```bash
gh repo create <내레포이름> --template JoHarim/vibe-kit --clone
cd <내레포이름>
node scripts/setup.mjs        # 도구 점검 (없는 것 알려줌)
pnpm install                  # 재료 하이드레이트
cp .env.example .env          # 열쇠 보관함 만들기 (처음엔 더미 그대로 OK)
pnpm dev                      # http://localhost:3000 — 첫 화면이 뜬다
```

## 이미 진행 중인 프로젝트에 얹기 (adopt)
새로 시작하는 게 아니라 **이미 만들던 프로젝트**가 있으면, 밀키트의 부품만 골라 주입한다:
```bash
# vibe-kit 폴더에서 실행 (--dry 로 미리보기 먼저)
node scripts/adopt.mjs --into ../내프로젝트 --dry
node scripts/adopt.mjs --into ../내프로젝트                       # 기본: claude,env,plan
node scripts/adopt.mjs --into ../내프로젝트 --parts claude,env,plan,integrations,e2e
```
- **먼저 `--dry` 로 뭐가 들어갈지 미리 본다** (아무것도 안 바꾸고 목록만 보여줌)
- 기존 파일은 **절대 덮지 않는다** (건너뛰고 알려줌 · 덮으려면 `--force`)
- `settings.json` 은 통째 교체가 아니라 **훅 항목만 병합**
- 대상의 `.env` 는 **절대 건드리지 않는다**
- 막히면 클로드에게 물어보기. adopt 는 "안 덮는다"가 원칙이라 안전하지만, 병합 결과가 헷갈리면 물어보는 게 빠르다.

## 부품 하나만 집어오기 (degit)
```bash
npx degit JoHarim/vibe-kit/packages/integrations/supabase lib/supabase
```

## 뭐가 들어있나
```
apps/web             웹앱 (Next.js) — pnpm dev 하면 바로 뜸        "화면이 웹이면 여기"
apps/mobile          모바일앱 (Expo) — 선택 재료(아래 참고)          "앱스토어에 낼 거면 여기"
packages/integrations/
  supabase           DB + 로그인 (실동작 — 키만 넣으면 바로)        제일 많이 씀
  ai                 AI 두뇌 (실동작 — Claude 연결됨)
  cloudflare         배포·엣지·파일저장 (냉동칸 — 활성화 1줄)
  google-sheets      시트를 DB처럼 (냉동칸 — 활성화 1줄)
packages/ui          공유 UI 자리 (shadcn 부품은 여기 또는 apps/web)
e2e                  Playwright — 자동 손님이 클릭 테스트
scripts/setup.mjs    도구(CLI) 점검·설치 안내
scripts/adopt.mjs    기존 프로젝트에 부품 주입
.claude/
  CLAUDE.md          클로드에게 주는 조언 (비개발자 배려·plan.md 우선)
  settings.json      훅 연결
  hooks/*.mjs        훅 6종 (node — jq·python 없이 어디서나 돔)
  skills/*           작업 스킬 8종 (기획·확인·디버그·배포·정리·마무리 등)
  agents/*           서브에이전트 2종 (code-reviewer · security-reviewer)
profile.md           내 프로필 (신청폼 → AI 눈높이·기획 선답변)
plan.md              내 기획서 (blueprint 가 채움 · progress 훅이 읽음)
.env.example         열쇠 보관함 견본 (바이브코더 상용 플랫폼 키 전부)
```

### 스킬 9종 (`.claude/skills/`)
클로드에게 **"기획하자" 처럼 말만 걸면** 알맞은 스킬이 알아서 뜬다. 명령어 외울 필요 없다.

| 스킬 | 언제 뜨나 | 하는 일 |
|------|----------|---------|
| **blueprint** | "기획하자" | 아이디어 → 8단계 질문 카드 → PRD·기능명세서·유저플로우·와이어프레임·DB 설계 |
| **check** | "이거 되나 확인해줘" | 눈이 아니라 손으로 진짜 되는지 확인 |
| **debug** | "에러 났어" | 버그를 원인부터 찾아 한 곳만 고침 |
| **deploy** | "배포하자" | 인터넷에 올려 남이 볼 수 있게 |
| **done-check** | "진짜 다 됐어?" | 완료 선언 직전 5문항 증거 검증 |
| **next** | "이제 뭐 하지?" | 막막할 때 다음 한 걸음만 짚어줌 |
| **tidy** | "정리 좀 하자" | 동작은 그대로 두고 코드 방 정리 |
| **wrap-up** | "오늘 여기까지" | 내일 이어서 하기 좋게 기록 |
| **handoff** | "코덱스한테 넘기자" | plan.md 블럭 1개를 다른 AI(Codex)용 자기완결 작업지시서로 |

### 서브에이전트 2종 (`.claude/agents/`)
서브에이전트 = **다른 눈으로 대신 봐주는 검사관**. 만든 사람과 분리된 시각으로 읽기만 한다(코드를 새로 짜지 않음).

| 에이전트 | 언제 | 하는 일 |
|----------|------|---------|
| **code-reviewer** | 블럭 완성 직후·머지 전 | 버그·품질 위반만 골라줌 |
| **security-reviewer** | 공개(배포) 직전 | 시크릿 노출·공개 삭제정책 같은 취약점만 스윕 |

## 2-AI 분업 (기획·리뷰 = Claude / 구현 = Codex)

구현을 다른 AI(OpenAI Codex CLI 등)에게 시키는 분업도 지원한다. 주방으로 치면 Claude 가 주방장(레시피·검식), Codex 가 요리사(조리)다.

- Codex 는 `.claude/CLAUDE.md` 를 읽지 않는다. 대신 루트의 **`AGENTS.md`** 가 킷의 코딩 규칙(4원칙·스택·보안 치명 3종)을 구현 AI용으로 미러링한다.
- 흐름: **"코덱스한테 넘기자"** → handoff 스킬이 plan.md 블럭 1개를 자기완결 작업지시서(`docs/plan/handoffs/`)로 뽑는다 → 그 파일을 Codex 에 붙여넣어 구현 → 돌아와서 **"리뷰해줘"** → code-reviewer 가 git diff 를 검사 → 통과하면 체크·커밋.
- 오더는 항상 지시서 한 장으로 나간다 — 대화 맥락은 넘어가지 않으니, 지시서에 없는 건 Codex 도 모른다.

## 기획부터 시작 (권장 흐름)
1. Claude Code 패널에서 **"기획하자"** → blueprint 스킬이 8단계로 자세히 묻는다 (아이디어→타겟→MVP 3개→유저플로우→화면→**DB 구조**→외부연동·키→운영). 질문은 **선택 카드**로 뜨고, 없는 답은 "기타"에 직접 적으면 된다.
2. 끝나면 `docs/plan/` 에 PRD·기능명세서·유저플로우·와이어프레임·DB 설계가 생기고 `plan.md` 가 채워진다.
3. **"1번 블럭 만들어줘"** — 한 번에 한 블럭씩. 훅이 localhost 를 자동으로 열어준다.

## 모바일(Expo)은 선택 재료
설치 용량이 커서 기본은 꺼져 있다. 쓰려면:
1. `pnpm-workspace.yaml` 에서 `# - "apps/mobile"` 주석 해제
2. `pnpm install` → `pnpm dev:mobile`

## 열쇠(.env) 규칙 — 꼭 읽기
- `.env` 는 **절대 깃허브에 올리지 않는다** (.gitignore 로 차단됨)
- 처음엔 전부 더미로 두고 화면부터. 진짜 키는 나중에 채워도 됨 — 코드가 "키 없음"을 친절히 알려준다
- 결제 키는 **반드시 테스트 키부터** (실키 전환은 오픈 직전 맨 마지막)
- **anon 키(Supabase 공개 키)는 화면에 노출돼도 정상이다.** 위험한 건 `service_role`·시크릿 키. 이건 클라이언트(브라우저) 코드에 절대 넣지 않는다.

## 보안 철학 (한 줄)
개발 중엔 **치명적인 3개만 자동으로 막는다**(시크릿·`service_role` 클라 노출 / 공개 삭제·수정 정책 / 결제는 테스트 키 먼저). RLS·입력검증 같은 나머지는 **디버깅을 방해하지 않게 놔뒀다가**, 남에게 공개하기 직전에 `security-reviewer` 가 한 번에 점검한다.

## 자세히
- 재료·오픈소스 활용법 → [docs/INGREDIENTS.md](docs/INGREDIENTS.md)
- 프로젝트 안 훅 설명 → [docs/HOOKS.md](docs/HOOKS.md)

---

> 크레딧: 설계 원리는 [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD)·[superpowers](https://github.com/obra/superpowers)(MIT)에서 영감을 받았다.
