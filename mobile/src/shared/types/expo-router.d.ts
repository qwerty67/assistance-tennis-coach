declare module 'expo-router' {
  export const router: {
    push: (url: string) => void;
    replace: (url: string) => void;
    back: () => void;
    canGoBack: () => boolean;
    setParams: (params: Record<string, string>) => void;
  };
  export const Link: any;
  export const Stack: any;
  export const Tabs: any;
  export const Redirect: any;
  export const Slot: any;
  export function useLocalSearchParams<T = any>(): T;
  export function useGlobalSearchParams<T = any>(): T;
  export function usePathname(): string;
  export function useRouter(): typeof router;
  export function useSegments(): string[];
}
