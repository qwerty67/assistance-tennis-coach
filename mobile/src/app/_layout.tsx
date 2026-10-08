import { useEffect, useState } from 'react';
import { I18nManager, Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Vazirmatn_400Regular, Vazirmatn_500Medium, Vazirmatn_700Bold, Vazirmatn_800ExtraBold } from '@expo-google-fonts/vazirmatn';
import '@/shared/i18n';
import { queryClient } from '@/shared/services/queryClient';
import { loadServerUrl } from '@/shared/services/config';
import { startOutboxSync } from '@/shared/services/offline/outbox';
import { useAuth } from '@/features/auth/store';
import { CelebrateHost, LoadingView, ToastHost } from '@/shared/components';
import { getDirection } from '@/shared/hooks/useDirection';
import { colors } from '@/shared/theme';

if (Platform.OS !== 'web' && !I18nManager.isRTL) {
  // Persist native RTL for next launches (dev/production builds).
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Vazirmatn_400Regular, Vazirmatn_500Medium, Vazirmatn_700Bold, Vazirmatn_800ExtraBold });
  const [ready, setReady] = useState(false);
  const hydrate = useAuth((s) => s.hydrate);

  useEffect(() => {
    Promise.all([loadServerUrl(), hydrate()]).finally(() => setReady(true));
    const unsub = startOutboxSync();
    return () => unsub();
  }, [hydrate]);

  const dir = getDirection();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <View style={{ flex: 1, backgroundColor: colors.background, direction: dir.manual ? 'rtl' : undefined }}>
            <StatusBar style="dark" />
            {fontsLoaded && ready ? (
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background },
                  animation: dir.manual ? 'slide_from_left' : 'default',
                }}
              />
            ) : (
              <LoadingView />
            )}
            <ToastHost />
            <CelebrateHost />
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
