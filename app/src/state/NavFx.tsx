import { createContext, useCallback, useContext, useMemo, type PropsWithChildren } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated from "react-native-reanimated";
import { useRouter, type Href } from "expo-router";
import { color } from "../theme/tokens";
import { useWipe } from "../theme/motion";

interface NavFxValue {
  /** `wipe`: an ink block sweeps across; the next screen is swapped in under it at the midpoint. */
  wipeTo: (href: Href, replace?: boolean) => Promise<void>;
}

const Ctx = createContext<NavFxValue | null>(null);

export function NavFxProvider({ children }: PropsWithChildren) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const wipe = useWipe(width);

  const wipeTo = useCallback(async (href: Href, replace = true) => {
    await wipe.run(); // resolves at the midpoint — screen is fully covered
    if (replace) router.replace(href); else router.push(href);
  }, [router, wipe]);

  const value = useMemo(() => ({ wipeTo }), [wipeTo]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <Animated.View pointerEvents="none" style={[styles.block, { width }, wipe.style]} />
    </Ctx.Provider>
  );
}

export function useNavFx(): NavFxValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useNavFx outside NavFxProvider");
  return v;
}

const styles = StyleSheet.create({
  block: { position: "absolute", top: 0, bottom: 0, left: 0, backgroundColor: color.ink },
});
