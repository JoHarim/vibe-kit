# 작업지시서 — Windows 호환 수리 3종 (2026-07-31)

## 배경 (2줄)

vibe-kit 은 비개발자용 바이브코딩 스타터킷이다(원래 맥 부트캠프용으로 만들어졌다). 사용자 환경은 **Windows 11** 인데, 훅 6종·환경점검 스크립트·adopt 스크립트가 맥 전용 문법으로 작성돼 **사용자 컴퓨터에서 처음부터 한 번도 동작한 적이 없다**(전부 조용히 실패해서 아무도 몰랐다).

이 지시서는 그 확정 버그 3건을 한 번에 고친다. **셋은 한 묶음이어야 한다** — 3번(adopt `--update`)이 없으면 1·2번 수정이 이미 만들어진 프로젝트(포트폴리오·hustle-cups·saju-web 등)에 영원히 전파되지 않는다.

---

## 만들 것

완료 기준: **Windows PowerShell 에서 훅이 실제로 발동하고, `node scripts/setup.mjs` 가 설치된 도구를 정확히 인식하고, `adopt --update` 로 기존 프로젝트에 갱신이 전파된다.**

### 작업 1. 훅 확정버그 3종

- [ ] **1-1. `.claude/settings.json` — 훅 6종 경로** — 확인: Windows 에서 `apps/` 아래 파일 Write 시 게이트 메시지가 뜬다
- [ ] **1-2. `.claude/hooks/plan-gate.mjs` — 경로 구분자 정규화** — 확인: 위와 동일 케이스에서 차단 발동
- [ ] **1-3. `.claude/hooks/progress-html.mjs` — 상위 탐색 무한루프** — 확인: `plan.md` 가 없는 폴더에서 세션을 끝내도 멈추지 않는다

### 작업 2. `scripts/setup.mjs` Windows 수리 + 점검 항목 확충

- [ ] **2-1. 도구 탐지 크로스플랫폼화** — 확인: `node scripts/setup.mjs` 가 설치된 node·git 을 "있음"으로 표시
- [ ] **2-2. 안내 문구 OS 분기 + `&&` 제거** — 확인: 출력된 명령을 PowerShell 에 붙여넣어 파서 에러가 안 난다
- [ ] **2-3. TOOLS 에 netlify CLI · Playwright 브라우저 추가** — 확인: 두 항목이 점검 목록에 나온다
- [ ] **2-4. README 시작 블록에 `npx playwright install chromium` 1줄**

### 작업 3. `scripts/adopt.mjs` 가드 수정 + `--update` 모드 + AGENTS.md 누락

- [ ] **3-1. 자기-adopt 가드 수정** — 확인: `--into C:\dev\vibe-kit\docs --dry` 가 `[중단]` 으로 막힌다
- [ ] **3-2. `--update` 모드 신설** — 확인: 대상의 `plan.md` 가 그대로 남아 있다
- [ ] **3-3. `claude` 부품에 루트 `AGENTS.md` 복사 추가** — 확인: adopt 후 대상 루트에 AGENTS.md 가 생긴다
- [ ] **3-4. README 에 "킷 업데이트를 기존 프로젝트에 반영하는 법" 3줄**

---

## 수정·생성할 파일

| 경로 | 무슨 역할 | 신규/수정 |
|---|---|---|
| `.claude/settings.json` | 훅 6종 등록표 | 수정 |
| `.claude/hooks/plan-gate.mjs` | 기획 전 코드작성 차단 게이트 | 수정 |
| `.claude/hooks/progress-html.mjs` | 진행률 HTML 생성 | 수정 |
| `scripts/setup.mjs` | 도구 설치 점검 | 수정 |
| `scripts/adopt.mjs` | 기존 프로젝트에 킷 주입 | 수정 |
| `README.md` | 사용 안내 | 수정 |

---

## 문제 상세 (원인과 고칠 지점 — 전부 실측 확인됨)

### 1-1. `settings.json` 의 `$CLAUDE_PROJECT_DIR`

현재 6개 훅이 전부 이 형태다:
```json
"command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/plan-gate.mjs\""
```
`$VAR` 는 POSIX 셸 문법이라 Windows 에서는 **문자 그대로 전달**된다 → node 가 `Cannot find module 'C:\...\$CLAUDE_PROJECT_DIR\.claude\hooks\plan-gate.mjs'` 로 죽는다. 훅은 fail-open 이라 사용자에게는 아무 증상이 없다.

**고칠 방향**: 6개 전부 상대경로로. 예: `node ".claude/hooks/plan-gate.mjs"`
(스크립트 내부는 `process.env.CLAUDE_PROJECT_DIR ?? process.cwd()` 폴백이 이미 있어 스크립트 경로 해석만 문제다.)

**주의 — 이 수정이 만드는 새 전제**: 상대경로는 "Claude 를 프로젝트 루트에서 열었다"를 전제한다. **하위 폴더에서 연 세션도 반드시 검증할 것**(사용자는 실제로 `C:\dev\포트폴리오\운동기록` 처럼 하위 폴더에서 여는 경우가 있다). 이 케이스가 깨지면 다른 방식(절대경로 계산 등)을 제안하고 멈춰라.

### 1-2. `plan-gate.mjs` 28~30행

```js
const rel = isAbsolute(fp) ? relative(root, fp) : fp;
if (rel.startsWith("..")) process.exit(0);
const inApps = rel === "apps" || rel.startsWith("apps/") || rel.includes("/apps/");
```
Windows 에서 `relative()` 는 `apps\web\page.tsx` 를 돌려준다 → `startsWith("apps/")` 도 `includes("/apps/")` 도 **영원히 false** → 게이트가 단 한 번도 발동하지 않는다. SKILL.md 가 "물리적으로 차단한다"고 약속한 기능이 통째로 무력하다.

**고칠 방향**: 28행 직후 구분자 정규화 한 줄. `rel = rel.split(sep).join("/")` (`sep` 은 `node:path` 에서 import).

### 1-3. `progress-html.mjs` 27행

```js
while (root !== "/" && !existsSync(join(root, "plan.md"))) root = dirname(root);
```
Windows 에서 드라이브 루트의 `dirname("C:\\")` 는 `"C:\\"` 를 돌려준다 → `root` 가 `"/"` 가 되는 일이 없어 **무한루프**. `plan.md` 가 없는 폴더에서 세션을 끝내면 걸린다.

**고칠 방향**: 이전 값과 같아지면(수렴하면) 중단하는 조건으로 교체.

### 2-1~2-2. `setup.mjs`

12·16·63행이 `spawnSync("/bin/sh", ["-c", ...])` 를 쓴다. Windows 에 `/bin/sh` 가 없어 **모든 도구 탐지가 실패** → node 로 실행 중인데도 node 를 "없음"으로 출력한다(설치 안내가 전부 무의미).

**고칠 방향**: `spawnSync(cmd, [flag], { shell: true })` 로 크로스플랫폼화.

22행 pnpm 안내 문구: `corepack enable && corepack prepare pnpm@9 --activate` — **PowerShell 5.1 은 `&&` 를 지원하지 않아 파서 에러**다. 두 줄로 분리하고, `npm i -g pnpm` 대안도 병기할 것(Node 25 에서 corepack 이 빠질 수 있다).

안내 문구 전반: Windows 명령(winget/scoop)을 본문에, 맥 명령(brew)은 괄호에 병기.

### 3-1. `adopt.mjs` 51행 가드

```js
if (TARGET === KIT || TARGET.startsWith(KIT + "/")) {
```
Windows 경로는 `C:\dev\vibe-kit\docs` 인데 비교 대상은 `C:\dev\vibe-kit/` (슬래시) → **절대 매치되지 않는다.** 실측: `--into C:\dev\vibe-kit\docs --dry` 가 중단 없이 진행됐다.

**고칠 방향**: `path.relative(KIT, TARGET)` 기반 판정 — 결과가 `..` 로 시작하지 않으면 킷 내부다. 드라이브 문자 대소문자 차이도 흡수된다.

### 3-2. `--update` 모드 (신설)

현재 adopt 는 "없는 것만 채운다"라서, 킷을 고쳐도 **이미 만들어진 프로젝트에는 영원히 전파되지 않는다.** 사용자는 이미 여러 프로젝트에 adopt 를 끝낸 상태다.

**동작 규칙:**
- **갱신 대상**: `.claude/hooks/*.mjs` · `.claude/skills/**` · `.claude/agents/**` · `.claude/settings.json`(훅 항목만 병합) · 루트 `AGENTS.md`
- **불가침 (절대 안 건드림)**: `plan.md` · `profile.md` · `docs/plan/**` · `.env` · 대상의 `.claude/CLAUDE.md`
- 기존 `--force` 는 `plan.md` 까지 덮으므로 위험하다 — `--update` 와 별개로 유지할 것

### 3-3. AGENTS.md 누락

`adoptClaude()` 가 hooks·skills·agents·CLAUDE.md·settings 만 복사하고 **루트 `AGENTS.md` 를 안 옮긴다**(실측). 이 파일은 구현 AI(너)가 킷 규칙을 읽는 유일한 통로라, 없으면 adopt 된 프로젝트에서 규칙이 전달되지 않는다.

**고칠 방향**: `claude` 부품에 `AGENTS.md` 복사 추가. 대상에 이미 있으면 기존 `copyFile` 규칙대로 건너뛴다(**덮지 마라** — 프로젝트별로 직접 쓴 AGENTS.md 가 있는 경우가 실제로 있다).

---

## 지킬 제약 (전체 규칙은 루트 AGENTS.md — 이 작업에 특히 걸리는 것)

- **최소 코드 · 수술적 수정.** 위에 적힌 결함만 고쳐라. 훅·스크립트의 다른 부분을 "개선"하지 마라. 리팩토링 금지.
- **훅의 fail-open 성질을 깨지 마라.** 훅이 실패해도 사용자 작업이 막히면 안 된다(에러 시 조용히 `exit 0`).
- 훅 스크립트는 **node 단독 의존**을 유지한다 — `jq`·`python`·셸 유틸에 새로 의존하지 마라(이식성이 이 킷의 설계 전제다).
- 비교는 `===` / `!==` 만.
- `.env` 읽기·쓰기 금지.
- **커밋하지 말고 멈춰라.** 리뷰는 Claude 쪽에서 `git diff` 로 돈다.

---

## 완료 기준 체크박스 (전부 체크돼야 끝)

- [ ] Windows PowerShell 에서 `node scripts/setup.mjs` 실행 → 설치된 도구가 "있음"으로 나온다 (실행 결과를 보고에 붙일 것)
- [ ] 훅 발동 확인 ①: 프로젝트 루트에서 연 세션에서 `apps/` 아래 코드 파일 Write → 게이트 차단
- [ ] 훅 발동 확인 ②: **하위 폴더에서 연 세션**에서도 훅이 죽지 않는다 (1-1 의 새 전제 검증 — 이 항목을 건너뛰지 마라)
- [ ] `plan.md` 없는 폴더에서 progress-html 훅이 무한루프 없이 종료
- [ ] `node scripts/adopt.mjs --into C:\dev\vibe-kit\docs --dry` → `[중단]` 출력
- [ ] `--update` 로 임시 폴더에 적용 후 그 폴더의 `plan.md` 내용이 그대로다
- [ ] adopt 후 대상 루트에 `AGENTS.md` 생성 확인 / 이미 있으면 건너뛰기 확인
- [ ] 커밋하지 않고 멈춤

---

## 검증 방법

```bash
# 1) 환경점검 (PowerShell 에서)
node scripts/setup.mjs

# 2) adopt 가드
node scripts/adopt.mjs --into C:\dev\vibe-kit\docs --dry     # [중단] 이 떠야 정상

# 3) --update 불가침 확인 (임시 폴더로)
mkdir C:\dev\_adopt-test
node scripts/adopt.mjs --into C:\dev\_adopt-test
echo "내가 쓴 기획" >> C:\dev\_adopt-test\plan.md
node scripts/adopt.mjs --into C:\dev\_adopt-test --update
type C:\dev\_adopt-test\plan.md          # "내가 쓴 기획" 이 남아 있어야 정상
dir C:\dev\_adopt-test\AGENTS.md         # 파일이 있어야 정상
```

훅 발동 확인은 Claude Code 세션에서 직접 해야 한다 — 스크립트로 자동화할 수 없으면 **"수동 확인 필요"라고 보고에 명시하고 넘겨라**(임의로 통과 처리하지 마라).

---

## 보고할 것

작업이 끝나면 다음을 보고하라:
1. 파일별 무엇을 바꿨는지 (1~2줄씩)
2. 위 검증 명령의 **실제 출력**
3. 확인 못 한 항목과 그 이유
4. 고치다 발견한 다른 문제 (**고치지 말고 보고만** — 수술적 수정 원칙)
