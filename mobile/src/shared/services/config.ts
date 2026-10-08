import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { storage } from './storage';

const KEY = 'server_url';

/**
 * API base URL resolution order:
 * 1. value saved from the login screen "server settings" (useful for real devices)
 * 2. EXPO_PUBLIC_API_URL env variable
 * 3. app.json -> expo.extra.apiUrl
 * 4. defaults: Android emulator -> 10.0.2.2, others -> localhost
 */
let current: string | null = null;

function fallback(): string {
  const env = process.env.EXPO_PUBLIC_API_URL;
  const extra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  if (env) return env;
  if (extra) return extra;
  return Platform.OS === 'android' ? 'http://10.0.2.2:8000/api/v1' : 'http://localhost:8000/api/v1';
}

export async function loadServerUrl(): Promise<string> {
  current = (await storage.get(KEY)) || fallback();
  return current;
}

export function getServerUrl(): string {
  return current ?? fallback();
}

export async function setServerUrl(url: string) {
  current = url.replace(/\/+$/, '');
  await storage.set(KEY, current);
}
