import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AIAnalysisScreenV1 from '../screens/AIAnalysisScreen';
import StudentsScreen from '../screens/StudentsScreen';
import DashboardScreen from '../screens/DashboardScreen';
import MatchScreen from '../screens/MatchScreen';
import MatchDetailsScreen from '../screens/MatchDetailsScreen';
import LiveMatchScreen from '../screens/LiveMatchScreen';
import AddStudentScreen from '../screens/AddStudentScreen';
import CreateMatchScreen from '../screens/CreateMatchScreen';
import {CustomTabBar, CustomHeader} from '../components/common';
import {COLORS} from '../theme';
import StudentDetailsScreen from '../screens/StudentDetailsScreen';
import EditStudentScreen from '../screens/EditStudentScreen';
import StatisticsDashboardScreen from '../screens/StatisticsDashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { BOTTOM_TABS } from './tabConfig';
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from "../screens/LoginScreen";
import {useTheme} from "../context/ThemeContext";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();


export function AuthStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    );
}
// ============================================
// STUDENTS STACK
// ============================================
function StudentsStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false, // ← ما از CustomHeader استفاده می‌کنیم
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="StudentsList" component={StudentsScreen}/>
            <Stack.Screen name="AddStudent" component={AddStudentScreen}/>
            <Stack.Screen name="StudentDetails" component={StudentDetailsScreen} />
            <Stack.Screen name="EditStudent" component={EditStudentScreen} />
            <Stack.Screen name="CreateMatch" component={CreateMatchScreen} />
        </Stack.Navigator>
    );
}

// ============================================
// DASHBOARD STACK
// ============================================
function DashboardStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="DashboardMain" component={DashboardScreen}/>
        </Stack.Navigator>
    );
}

function MatchStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="Match" component={MatchScreen}/>
            <Stack.Screen name="CreateMatch" component={CreateMatchScreen}/>
            <Stack.Screen name="MatchDetails" component={MatchDetailsScreen}/>
            <Stack.Screen name="LiveMatch" component={LiveMatchScreen}/>
            <Stack.Screen name="AIAnalysis" component={AIAnalysisScreenV1}/>
        </Stack.Navigator>
    );
}

function StatisticsStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="StatisticsDashboard" component={StatisticsDashboardScreen}/>
        </Stack.Navigator>
    );
}

function SettingStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="Settings" component={SettingsScreen}/>
        </Stack.Navigator>
    );
}

// ============================================
// MAIN APP NAVIGATOR
// ============================================
export default function AppNavigator() {
    const { colors } = useTheme(); // ✅ دریافت تم

    return (
        // <NavigationContainer>
            <Tab.Navigator
                initialRouteName="Dashboard"
                tabBar={(props) => <CustomTabBar {...props} />}
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: 'transparent', // تب‌بار خودش رنگ دارد
                        borderTopWidth: 0, // حذف حاشیه پیش‌فرض
                    },
                    sceneContainerStyle: {
                        backgroundColor: colors.background, // ✅ پس‌زمینه صفحات
                    },
                }}
            >
                {/*<Tab.Screen name="Students" component={StudentsStack}/>*/}
                {/*<Tab.Screen name="Dashboard" component={DashboardStack}/>*/}


                {/*<Tab.Screen name="Students" component={StudentsScreen} options={{ headerShown: false }} />*/}
                {/*<Tab.Screen name="CreateMatch" component={MatchScreen} options={{ headerShown: false }} />*/}
                {/*<Tab.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />*/}
                {/*<Tab.Screen name="Statistics" component={StatisticsDashboardScreen} options={{ headerShown: false }} />*/}
                {/*<Tab.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />*/}
                {/* تب‌ها بر اساس BOTTOM_TABS تعریف می‌شوند */}
                {BOTTOM_TABS.map((tab) => {
                    // انتخاب کامپوننت بر اساس نام تب
                    let ScreenComponent;
                    switch (tab.name) {
                        case 'Dashboard':
                            ScreenComponent = DashboardStack;
                            break;
                        case 'Students':
                            ScreenComponent = StudentsStack;
                            break;
                        case 'Match':
                            ScreenComponent = MatchStack;
                            break;
                        case 'Statistics':
                            ScreenComponent = StatisticsStack;
                            break;
                        case 'Settings':
                            ScreenComponent = SettingStack;
                            break;
                        default:
                            ScreenComponent = DashboardScreen;
                    }

                    return (
                        <Tab.Screen
                            key={tab.name}
                            name={tab.name}
                            component={ScreenComponent}
                            options={{
                                headerShown: false,
                            }}
                        />
                    );
                })}
            </Tab.Navigator>
        // </NavigationContainer>
    );
}