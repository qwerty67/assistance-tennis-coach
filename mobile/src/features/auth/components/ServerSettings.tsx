import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Sheet, TextField, AppText } from '@/shared/components';
import { getServerUrl, setServerUrl } from '@/shared/services/config';
import { useFeedback } from '@/shared/hooks/useFeedback';

/** Lets the user point the app to the backend (e.g. http://192.168.1.10:8000/api/v1 on a real phone). */
export function ServerSettings({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [url, setUrl] = useState(getServerUrl());
  const fb = useFeedback();
  return (
    <Sheet visible={visible} onClose={onClose} title={t('auth.serverSettings')}
      footer={<Button title={t('common.save')} onPress={async () => { await setServerUrl(url.trim()); fb.success(t('common.saved')); onClose(); }} />}>
      <AppText variant="small" muted>{t('auth.serverHint')}</AppText>
      <TextField label={t('auth.serverUrl')} value={url} onChangeText={setUrl} ltr autoCapitalize="none" keyboardType="url" />
    </Sheet>
  );
}
