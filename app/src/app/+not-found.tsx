import { useRouter } from "expo-router";
import { UnknownErrorState } from "../ui/states";

/**
 * Any route that does not exist — a stale deep link, a notification pointing at an advisory that
 * has since aged out. Expo Router renders this instead of a blank screen.
 */
export default function NotFound() {
  const router = useRouter();
  return <UnknownErrorState code="404" onRestart={() => router.replace("/")} />;
}
