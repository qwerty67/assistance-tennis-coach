import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStudents } from '@/features/students/api';
import { AppText, Avatar, Button, Icon, ListRow, Sheet, TextField } from '@/shared/components';
import { colors } from '@/shared/theme';

/** Multi/single select student picker sheet (reused by classes, terms, payments, plans). */
export function StudentPicker({ visible, onClose, selected, onChange, single, title }: {
  visible: boolean; onClose: () => void; selected: string[]; onChange: (ids: string[]) => void; single?: boolean; title?: string;
}) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const { data } = useStudents({ status: 'active' });
  const list = (data ?? []).filter((s) => `${s.first_name} ${s.last_name}`.includes(q.trim()));
  return (
    <Sheet visible={visible} onClose={onClose} title={title ?? t('students.select')} footer={single ? undefined : <Button title={t('common.done')} onPress={onClose} />}>
      <TextField icon="magnify" placeholder={t('students.search')} value={q} onChangeText={setQ} />
      <View>
        {list.map((s) => {
          const on = selected.includes(s.id);
          return (
            <ListRow key={s.id} left={<Avatar name={`${s.first_name} ${s.last_name}`} size={36} />} title={`${s.first_name} ${s.last_name}`}
              subtitle={t(`students.level.${s.level}`)} chevron={false}
              right={<Icon name={on ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'} size={24} color={on ? colors.primary : colors.textSubtle} />}
              onPress={() => {
                if (single) { onChange([s.id]); onClose(); return; }
                onChange(on ? selected.filter((x) => x !== s.id) : [...selected, s.id]);
              }} divider />
          );
        })}
        {!list.length ? <AppText muted align="center">{t('students.empty')}</AppText> : null}
      </View>
    </Sheet>
  );
}
