import { authService } from '@/services/auth.service';
import { rtdb } from '@/services/firebase';
import { router } from 'expo-router';
import { get as dbGet, ref as dbRef, remove as dbRemove, update as dbUpdate } from 'firebase/database';
import { AlertTriangle, ArrowLeft, Check, Database, DollarSign, Inbox, Package, Trash2, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ScreenTopBar } from '@/components/screen-top-bar';

interface Notification {
    id: string;
    type: 'payment' | 'stock' | 'khata' | 'team' | 'system';
    title: string;
    body: string;
    time: string;
    read: boolean;
    createdAt: number;
}

export default function NotificationsScreen() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

    const user = authService.getCurrentUser();

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }
        try {
            const snap = await dbGet(dbRef(rtdb, `notifications/${user.uid}`));
            if (snap.exists()) {
                const data = snap.val();
                const list = Object.entries(data).map(([id, val]: [string, any]) => ({
                    id,
                    ...val,
                })).sort((a, b) => b.createdAt - a.createdAt);
                setNotifications(list);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const markAllRead = async () => {
        if (!user?.uid) return;
        const updates: Record<string, boolean> = {};
        notifications.forEach(n => {
            if (!n.read) updates[`notifications/${user.uid}/${n.id}/read`] = true;
        });
        await dbUpdate(dbRef(rtdb), updates);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = async (id: string) => {
        if (!user?.uid) return;
        await dbRemove(dbRef(rtdb, `notifications/${user.uid}/${id}`));
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = async () => {
        if (!user?.uid) return;
        await dbRemove(dbRef(rtdb, `notifications/${user.uid}`));
        setNotifications([]);
    };

    const filtered = activeFilter === 'unread'
        ? notifications.filter(n => !n.read)
        : notifications;

    const unreadCount = notifications.filter(n => !n.read).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'payment': return { icon: DollarSign, color: '#10b981', bg: '#10b98120' };
            case 'khata': return { icon: AlertTriangle, color: '#ef4444', bg: '#ef444420' };
            case 'stock': return { icon: Package, color: '#f59e0b', bg: '#f59e0b20' };
            case 'team': return { icon: Users, color: '#8b7cf7', bg: '#8b7cf720' };
            default: return { icon: Database, color: '#6b7280', bg: '#6b728020' };
        }
    };

    const formatTime = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 1) return 'JUST NOW';
        if (mins < 60) return `${mins}M AGO`;
        if (hours < 24) return `${hours}H AGO`;
        if (days === 1) return 'YESTERDAY';
        return `${days} DAYS AGO`;
    };

    if (loading) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Text className="text-text-muted" style={{ fontFamily: 'DMSans_400Regular' }}>Loading...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">
            <ScreenTopBar>
                <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <Pressable onPress={() => router.back()} className="mr-3">
                        <ArrowLeft size={24} color="#ffffff" />
                    </Pressable>
                    <View>
                        <Text className="text-white text-xl font-bold" style={{ fontFamily: 'DMSans_700Bold' }}>
                            Notifications
                        </Text>
                        <Text className="text-text-secondary text-sm" style={{ fontFamily: 'DMSans_400Regular' }}>
                            {unreadCount} unread
                        </Text>
                    </View>
                </View>
                {unreadCount > 0 && (
                    <Pressable onPress={markAllRead} className="flex-row items-center">
                        <Check size={16} color="#8b7cf7" />
                        <Text className="text-primary text-sm ml-1" style={{ fontFamily: 'DMSans_500Medium' }}>
                            Mark all
                        </Text>
                    </Pressable>
                )}
                </View>
            </ScreenTopBar>

            {/* Filter Tabs */}
            {notifications.length > 0 && (
                <View className="flex-row px-4 mt-2 mb-4">
                    <Pressable
                        onPress={() => setActiveFilter('all')}
                        className={`rounded-full px-4 py-2 mr-2 ${activeFilter === 'all' ? 'bg-primary' : 'bg-surface-light border border-border'}`}
                    >
                        <Text className={`text-sm ${activeFilter === 'all' ? 'text-white' : 'text-text-secondary'}`} style={{ fontFamily: 'DMSans_500Medium' }}>
                            All
                        </Text>
                    </Pressable>
                    {unreadCount > 0 && (
                        <Pressable
                            onPress={() => setActiveFilter('unread')}
                            className={`rounded-full px-4 py-2 ${activeFilter === 'unread' ? 'bg-primary' : 'bg-surface-light border border-border'}`}
                        >
                            <Text className={`text-sm ${activeFilter === 'unread' ? 'text-white' : 'text-text-secondary'}`} style={{ fontFamily: 'DMSans_500Medium' }}>
                                Unread ({unreadCount})
                            </Text>
                        </Pressable>
                    )}
                </View>
            )}

            {/* Notifications List */}
            <ScrollView className="flex-1 px-4">
                {filtered.length === 0 ? (
                    <View className="items-center justify-center py-20">
                        <View className="w-20 h-20 rounded-full bg-surface-light items-center justify-center mb-4">
                            <Inbox size={32} color="#6b7280" />
                        </View>
                        <Text className="text-text-secondary" style={{ fontFamily: 'DMSans_500Medium' }}>
                            {activeFilter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                        </Text>
                        <Text className="text-text-muted text-sm mt-1" style={{ fontFamily: 'DMSans_400Regular' }}>
                            {activeFilter === 'unread' ? 'All caught up!' : 'Notifications will appear here'}
                        </Text>
                    </View>
                ) : (
                    <>
                        {filtered.map((notification) => {
                            const { icon: Icon, color, bg } = getIcon(notification.type);
                            return (
                                <View
                                    key={notification.id}
                                    className={`bg-surface rounded-2xl p-4 border border-border mb-3 flex-row items-start ${!notification.read ? 'border-l-4 border-l-primary' : ''
                                        }`}
                                >
                                    <View
                                        className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
                                        style={{ backgroundColor: bg }}
                                    >
                                        <Icon size={22} color={color} />
                                    </View>
                                    <View className="flex-1">
                                        <View className="flex-row items-center justify-between">
                                            <Text className="text-white font-medium" style={{ fontFamily: 'DMSans_500Medium' }}>
                                                {notification.title}
                                            </Text>
                                            {!notification.read && (
                                                <View className="w-2 h-2 rounded-full bg-primary" />
                                            )}
                                        </View>
                                        <Text className="text-text-secondary text-sm mt-1" style={{ fontFamily: 'DMSans_400Regular' }}>
                                            {notification.body}
                                        </Text>
                                        <Text className="text-text-muted text-xs mt-2" style={{ fontFamily: 'DMSans_400Regular' }}>
                                            {formatTime(notification.createdAt)}
                                        </Text>
                                    </View>
                                    <Pressable onPress={() => deleteNotification(notification.id)} className="ml-2">
                                        <Trash2 size={18} color="#6b7280" />
                                    </Pressable>
                                </View>
                            );
                        })}

                        {notifications.length > 0 && (
                            <Pressable onPress={clearAll} className="bg-surface rounded-xl py-3 items-center border border-border mt-2 mb-6">
                                <Text className="text-text-secondary" style={{ fontFamily: 'DMSans_500Medium' }}>
                                    Clear all
                                </Text>
                            </Pressable>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}