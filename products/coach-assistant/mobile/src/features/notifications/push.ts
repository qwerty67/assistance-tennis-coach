/**
 * Push notification registration (Expo push -> FCM / APNs).
 * Works in development / production builds. In Expo Go (Android, SDK 53+) remote push is not
 * available, so we silently skip – the in-app inbox still works.
 */
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { notificationsApi } from './api';

function isNativeModuleAvailable(name: string): boolean {
  try {
    // Check global expo JSI registry first
    const globalExpo = (globalThis as any).expo;
    if (globalExpo?.modules?.[name]) return true;

    // Check expo-modules-core safe lookup
    const core = require('expo-modules-core');
    if (typeof core.requireOptionalNativeModule === 'function') {
      return Boolean(core.requireOptionalNativeModule(name));
    }
    return false;
  } catch {
    return false;
  }
}

export async function registerForPush(): Promise<string | null> {
  try {
    if (Platform.OS === 'web' || !Device.isDevice) return null;

    // Detect Expo Go or environments without native notification/application support
    const isExpoGo =
      (Constants as any).appOwnership === 'expo' ||
      Constants.executionEnvironment === 'storeClient';

    if (isExpoGo) return null;

    // Check if required native modules are linked in this build
    if (!isNativeModuleAvailable('ExpoApplication') || !isNativeModuleAvailable('ExpoNotifications')) {
      return null;
    }

    const Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return null;

    const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
    await notificationsApi.registerDevice(token, Platform.OS);
    return token;
  } catch {
    // Silently ignore push setup errors in dev/Expo Go
    return null;
  }
}
