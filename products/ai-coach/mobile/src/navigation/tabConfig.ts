import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface TabConfigItem {
    name: string;
    label: string;
    labelFa: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    iconFocused: keyof typeof MaterialCommunityIcons.glyphMap;
    isCenter?: boolean; // ✅ برای مشخص کردن دکمه وسط
}

export const BOTTOM_TABS: TabConfigItem[] = [
    {
        name: 'Students',
        label: 'Students',
        labelFa: 'شاگردان',
        icon: 'account-group-outline',
        iconFocused: 'account-group',
    },
    {
        name: 'Match',
        label: 'Matches',
        labelFa: 'مسابقات',
        icon: 'trophy-outline',
        iconFocused: 'trophy',
    },
    {
        name: 'Dashboard',
        label: 'Dashboard',
        labelFa: 'داشبورد',
        icon: 'tennis', // یا هر آیکون دیگری که می‌خواهید
        iconFocused: 'tennis',
        isCenter: true, // ✅ این دکمه وسط و بزرگ است
    },
    {
        name: 'Statistics',
        label: 'Statistics',
        labelFa: 'آمار',
        icon: 'chart-bar',
        iconFocused: 'chart-bar',
    },
    {
        name: 'Settings',
        label: 'Settings',
        labelFa: 'تنظیمات',
        icon: 'cog-outline',
        iconFocused: 'cog',
    },
];