import { forwardRef, ReactNode, useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';
import { colors, fonts, radius, spacing } from '@/shared/theme';
import { getDirection } from '@/shared/hooks/useDirection';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: IconName;
  suffix?: ReactNode;
  ltr?: boolean; // email, phone, url fields
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, icon, suffix, ltr, style, multiline, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const dir = getDirection();
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;
  return (
    <View style={{ gap: 6 }}>
      {label ? <AppText variant="bodyMedium">{label}</AppText> : null}
      <View style={[styles.box, { borderColor }, multiline && { minHeight: 96, alignItems: 'flex-start', paddingVertical: spacing.sm }]}>
        {icon ? <Icon name={icon} size={20} color={colors.textMuted} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textSubtle}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            { textAlign: ltr ? 'left' : dir.isRTL ? 'right' : 'left', writingDirection: ltr ? 'ltr' : dir.isRTL ? 'rtl' : 'ltr' },
            multiline && { textAlignVertical: 'top', minHeight: 80 },
            style,
          ]}
          {...rest}
        />
        {suffix}
      </View>
      {error ? (
        <AppText variant="small" color={colors.danger}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="small" muted>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1.2,
    borderRadius: radius.md, paddingHorizontal: spacing.md, minHeight: 50,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.text, paddingVertical: 10, outlineStyle: 'none' } as object,
});
