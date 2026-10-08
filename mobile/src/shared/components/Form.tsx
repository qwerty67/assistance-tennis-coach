import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { TextField, TextFieldProps } from './TextField';
import { MoneyField, NumberField } from './MoneyField';
import { DateField } from './DatePicker';
import { Chips, ChipOption } from './Chips';
import i18n from '@/shared/i18n';

type Base<T extends FieldValues> = { control: Control<T>; name: Path<T>; label?: string };

const msg = (m?: string) => (m ? (i18n.exists(m) ? i18n.t(m) : m) : undefined);

/** react-hook-form bound fields – errors are i18n keys resolved here. */
export function FormText<T extends FieldValues>({ control, name, ...rest }: Base<T> & Omit<TextFieldProps, 'value' | 'onChangeText'>) {
  return (
    <Controller control={control} name={name} render={({ field, fieldState }) => (
      <TextField {...rest} value={field.value ?? ''} onChangeText={field.onChange} onBlur={field.onBlur} error={msg(fieldState.error?.message)} />
    )} />
  );
}

export function FormMoney<T extends FieldValues>({ control, name, label, hint }: Base<T> & { hint?: string }) {
  return (
    <Controller control={control} name={name} render={({ field, fieldState }) => (
      <MoneyField label={label} hint={hint} value={field.value} onChange={field.onChange} error={msg(fieldState.error?.message)} />
    )} />
  );
}

export function FormNumber<T extends FieldValues>({ control, name, label, hint }: Base<T> & { hint?: string }) {
  return (
    <Controller control={control} name={name} render={({ field, fieldState }) => (
      <NumberField label={label} hint={hint} value={field.value} onChange={field.onChange} error={msg(fieldState.error?.message)} />
    )} />
  );
}

export function FormDate<T extends FieldValues>({ control, name, label }: Base<T>) {
  return (
    <Controller control={control} name={name} render={({ field, fieldState }) => (
      <DateField label={label} value={field.value} onChange={field.onChange} error={msg(fieldState.error?.message)} />
    )} />
  );
}

export function FormChips<T extends FieldValues, V extends string | number>({ control, name, label, options, scroll }: Base<T> & { options: ChipOption<V>[]; scroll?: boolean }) {
  return (
    <Controller control={control} name={name} render={({ field }) => (
      <Chips label={label} options={options} value={field.value} onChange={field.onChange} scroll={scroll} />
    )} />
  );
}
