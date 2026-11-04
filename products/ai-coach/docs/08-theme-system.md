#  سیستم تم - TennisPilot (خلاصه)

**معماری:** React Context + AsyncStorage  
**حالت‌ها:** Light (روشن) | Dark (تاریک) | System (پیش‌فرض دستگاه)

---

## 🛠️ نحوه استفاده

```typescript
import { useTheme } from '../context/ThemeContext';

const MyComponent = () => {
  const { colors, shadows, isDark, toggleTheme, setMode } = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.background, ...shadows.sm }}>
      <Text style={{ color: colors.text }}>Hello</Text>
    </View>
  );
};
```

---

## 🎨 پالت رنگی (اصلی)

| نقش | Light Mode | Dark Mode |
|-----|------------|-----------|
| **Primary** | `#2563EB` (آبی) | `#60A5FA` (آبی روشن) |
| **Background** | `#F8FAFC` | `#0F172A` |
| **Surface** | `#FFFFFF` | `#1E293B` |
| **Text** | `#0F172A` | `#F1F5F9` |

---

## 💾 ذخیره‌سازی

تنظیمات کاربر در **AsyncStorage** با کلید `@app_theme_mode` ذخیره می‌شود و در بازگشایی بعدی اپلیکیشن به صورت خودکار اعمال می‌گردد.

---

## ✅ قوانین طلایی (Best Practices)

- [ ] **همیشه داینامیک:** از `colors.background` (با حرف کوچک) استفاده کنید.
- [ ] **ممنوعیت استاتیک:** هرگز از `COLORS.background` (با حروف بزرگ) در استایل inline استفاده نکنید.
- [ ] **سایه‌ها:** از `shadows.sm` یا `shadows.md` استفاده کنید تا در دارک مود کنتراست مناسب داشته باشد.

---

## 🐛 عیب‌یابی سریع

- **رنگ‌ها تغییر نمی‌کنند:** بررسی کنید `ThemeProvider` در `App.tsx` کل برنامه را wrap کرده باشد.
- **برخی بخش‌ها دارک نمی‌شوند:** در آن کامپوننت خاص از `COLORS` استاتیک استفاده شده است؛ آن را به `useTheme` تغییر دهید.
- **تنظیمات ذخیره نمی‌شود:** پکیج `@react-native-async-storage/async-storage` نصب و لینک شده است.

---

**مستندات کامل:** `08-theme-system.md`