# packages/ui — 공유 UI (오픈소스 부품 활용 예시)

화면 부품을 처음부터 만들지 않는다. **남이 잘 만든 오픈소스 부품을 가져다 쓴다.**

## shadcn/ui (권장)
버튼·카드·모달·폼 같은 부품을 복사해 쓰는 방식. 내 코드로 들어와서 마음대로 고칠 수 있다.
```
npx shadcn@latest add button card dialog
```
→ 이 폴더에 컴포넌트가 복사된다. `apps/web` 에서 import.

## 오픈소스 활용 원칙 (docs/INGREDIENTS.md 참고)
- 직접 만들기 전에 "이미 누가 만들었나" 먼저 찾는다 (npm · GitHub).
- 별(star) 많고 최근 업데이트된 것 우선.
- 라이선스 확인 (MIT면 대체로 자유).
