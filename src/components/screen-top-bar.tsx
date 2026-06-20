import { ReactNode } from "react";
import { View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/utils/helpers";

export const STATUS_BAR_BACKGROUND = "#0f0f1a";
const TOP_BAR_GAP = 8;

interface ScreenTopBarProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  style?: ViewStyle;
}

export function ScreenTopBar({
  children,
  className,
  contentClassName,
  style,
}: ScreenTopBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={cn("bg-background z-10", className)}
      style={[{ paddingTop: insets.top + TOP_BAR_GAP }, style]}
    >
      <View className={cn("px-4 pb-2", contentClassName)}>{children}</View>
    </View>
  );
}

export function useScreenTopInset(extraGap = 16) {
  const insets = useSafeAreaInsets();
  return insets.top + TOP_BAR_GAP + extraGap;
}
