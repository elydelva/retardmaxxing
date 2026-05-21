import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Platform } from "react-native";

export interface SymbolProps {
  name: SymbolViewProps["name"];
  size?: number;
  tintColor?: string;
  fallback?: React.ReactNode;
}

export function Symbol({ name, size = 20, tintColor, fallback = null }: SymbolProps) {
  if (Platform.OS !== "ios") return <>{fallback}</>;
  const tintProps = tintColor ? { tintColor } : {};
  return (
    <SymbolView
      name={name}
      size={size}
      {...tintProps}
      resizeMode="scaleAspectFit"
      style={{ width: size, height: size }}
    />
  );
}
