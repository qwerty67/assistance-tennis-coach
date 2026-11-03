# 🎨 مستندات کامپوننت‌های UI - TennisPilot (خلاصه)

---

## 🎨 سیستم طراحی

### رنگ‌ها (از `useTheme`)
- **Primary:** `#2563EB` (آبی)
- **Success:** `#10B981` (سبز)
- **Warning:** `#F59E0B` (نارنجی)
- **Error:** `#EF4444` (قرمز)

### فاصله‌ها
```typescript
SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 }
```

### تایپوگرافی
```typescript
fontSize: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, xxl: 24 }
fontWeight: { normal: '400', medium: '500', semibold: '600', bold: '700' }
```

---

##  کامپوننت‌های مشترک

### CustomHeader
```typescript
<CustomHeader
  title="عنوان"
  subtitle="زیرعنوان"
  onBack={() => navigation.goBack()}
  rightActions={[{ icon: 'delete', onPress: handleDelete }]}
/>
```

### AppCard
```typescript
<AppCard style={styles.card}>
  <Text>محتوا</Text>
</AppCard>
```

### ModernButton
```typescript
<ModernButton
  title="ذخیره"
  onPress={handleSave}
  variant="primary" // primary | secondary | outline | destructive
  icon="content-save"
  fullWidth
  size="md" // sm | md | lg
  loading={false}
/>
```

### ModernTextInput
```typescript
<ModernTextInput
  label="نام"
  value={name}
  onChangeText={setName}
  placeholder="ورودی..."
  error={errors.name}
  icon="account"
  multiline={false}
  textAlign="right"
/>
```

### ConfirmationDialog
```typescript
<ConfirmationDialog
  visible={dialogVisible}
  title="تأیید"
  message="آیا مطمئن هستید؟"
  icon="alert-circle"
  onDismiss={() => setDialogVisible(false)}
  actions={[
    { label: 'انصراف', onPress: cancel, variant: 'cancel' },
    { label: 'تأیید', onPress: confirm, variant: 'primary' }
  ]}
/>
```

### Skeleton Components
```typescript
<Skeleton width={100} height={20} />
<SkeletonCard />
<SkeletonAvatar />
<SkeletonStatGrid />
```

---

## 🎾 کامپوننت‌های مسابقه

### ScoreBoard
```typescript
<ScoreBoard
  scoreState={scoringEngine.getState()}
  studentName="طه"
  opponentName="رضا"
/>
```

### MatchCard
```typescript
<MatchCard
  match={matchData}
  navigation={navigation}
/>
```

### FinalStrokeForm
```typescript
<FinalStrokeForm
  onSubmit={handleFinalStroke}
  onCancel={handleCancel}
  studentName="طه"
  opponentName="رضا"
/>
```

---

## 📊 کامپوننت‌های تحلیل

### StatItem
```typescript
<StatItem
  label="کل مسابقات"
  value={stats.totalMatches}
  icon="tennis"
  color={colors.text}
  subtitle="66%"
/>
```

### MarkdownReport
```typescript
<MarkdownReport content={markdownText} />
// پشتیبانی کامل از RTL و فارسی
```

### ShotDistributionChart
```typescript
<ShotDistributionChart
  winners={15}
  forcedErrors={8}
  unforcedErrors={12}
/>
// نمودار دونات
```

---

## 👥 کامپوننت‌های شاگرد

### StudentCard
```typescript
<StudentCard
  student={studentData}
  onPress={() => navigation.navigate('Details')}
  onDelete={handleDelete}
/>
```

---

## 🌙 سایر

### ThemeToggle
```typescript
<ThemeToggle />
// دکمه تغییر تم (Light/Dark)
```

### CustomTabBar
- **منبع:** `src/navigation/tabConfig.ts`
- دکمه وسط برجسته برای Dashboard
- پشتیبانی خودکار از Dark Mode

---

## ✅ نکات مهم

1. **همیشه از `useTheme` استفاده کنید** نه `COLORS` استاتیک
2. **برای فارسی:** `textAlign: 'right'` فراموش نشود
3. **کامپوننت‌ها قابل استفاده مجدد هستند** - از کپی کردن پرهیز کنید
4. **برای loading:** از Skeleton یا ActivityIndicator استفاده کنید
5. **برای خطاها:** از Toast یا ConfirmationDialog استفاده کنید

---

**مستندات کامل:** `05-ui-components.md`