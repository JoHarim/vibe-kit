// 모바일 앱 시작점. 폰 앱을 만들 거면 여기부터.
// 클로드에게 "모바일로 plan.md 첫 화면 만들어줘" 하면 채워진다.
import { Text, View } from "react-native";

export default function App() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "800" }}>vibe-kit</Text>
      <Text style={{ color: "#888" }}>여기에 내 폰 앱을 얹으면 됩니다.</Text>
    </View>
  );
}
