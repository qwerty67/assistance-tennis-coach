import { TextField, TextFieldProps } from './TextField';
import { AppText } from './AppText';
import { formatNumber, toLatinDigits } from '@/shared/utils/format';
import { useTranslation } from 'react-i18next';

interface Props extends Omit<TextFieldProps, 'value' | 'onChangeText' | 'onChange'> {
  value?: number | null;
  onChange: (v: number | null) => void;
}

/** Numeric money input: accepts Persian digits, shows thousand separators and currency unit. */
export function MoneyField({ value, onChange, ...rest }: Props) {
  const { t } = useTranslation();
  return (
    <TextField
      {...rest}
      keyboardType="number-pad"
      value={value === null || value === undefined ? '' : formatNumber(value)}
      onChangeText={(s) => {
        const n = toLatinDigits(s).replace(/[^\d]/g, '');
        onChange(n ? Number(n) : null);
      }}
      suffix={<AppText variant="small" muted>{t('common.currency')}</AppText>}
    />
  );
}

export function NumberField({ value, onChange, ...rest }: Props) {
  return (
    <TextField
      {...rest}
      keyboardType="number-pad"
      value={value === null || value === undefined ? '' : formatNumber(value)}
      onChangeText={(s) => {
        const n = toLatinDigits(s).replace(/[^\d]/g, '');
        onChange(n ? Number(n) : null);
      }}
    />
  );
}
