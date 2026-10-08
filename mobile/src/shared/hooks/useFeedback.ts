import { create } from 'zustand';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

type Kind = 'success' | 'error' | 'info';
interface FeedbackState {
  toast: { id: number; kind: Kind; message: string } | null;
  celebrate: { id: number; message: string } | null;
  show: (kind: Kind, message: string) => void;
  success: (message: string, big?: boolean) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  clear: () => void;
  clearCelebrate: () => void;
}

const haptic = (kind: Kind) => {
  if (Platform.OS === 'web') return;
  const map = {
    success: Haptics.NotificationFeedbackType.Success,
    error: Haptics.NotificationFeedbackType.Error,
    info: Haptics.NotificationFeedbackType.Warning,
  };
  Haptics.notificationAsync(map[kind]).catch(() => {});
};

/** Global toast + success animation (payment success, attendance registered...). */
export const useFeedback = create<FeedbackState>((set) => ({
  toast: null,
  celebrate: null,
  show: (kind, message) => {
    haptic(kind);
    set({ toast: { id: Date.now(), kind, message } });
  },
  success: (message, big = false) => {
    haptic('success');
    if (big) set({ celebrate: { id: Date.now(), message } });
    else set({ toast: { id: Date.now(), kind: 'success', message } });
  },
  error: (message) => {
    haptic('error');
    set({ toast: { id: Date.now(), kind: 'error', message } });
  },
  info: (message) => {
    haptic('info');
    set({ toast: { id: Date.now(), kind: 'info', message } });
  },
  clear: () => set({ toast: null }),
  clearCelebrate: () => set({ celebrate: null }),
}));
