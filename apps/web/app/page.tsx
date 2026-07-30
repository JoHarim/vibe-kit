// 웹앱 시작점. 클로드에게 "plan.md 대로 첫 화면 만들어줘" 하면 여기부터 채워진다.
export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: 48, textAlign: "center" }}>
      <h1>vibe-kit</h1>
      <p>여기에 내 아이디어를 얹으면 됩니다.</p>
      <p style={{ color: "#888", fontSize: 14 }}>
        클로드 코드: &quot;plan.md 대로 첫 블럭 만들어줘&quot;
      </p>
    </main>
  );
}
