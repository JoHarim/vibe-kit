// 모든 페이지를 감싸는 껍데기(레이아웃). 폰트·공통 헤더 자리.
export const metadata = { title: "vibe-kit", description: "바이브코딩 밀키트" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
