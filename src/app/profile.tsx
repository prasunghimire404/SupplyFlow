import { rtdb } from '@/services/firebase';
import { useAuthStore } from '@/store/auth-store';
import { getInitials } from '@/utils/helpers';
import { router } from 'expo-router';
import { get as dbGet, ref as dbRef } from 'firebase/database';
import { ArrowLeft, Briefcase, LogOut, Mail, MapPin, Pencil, Phone, Settings } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { ScreenTopBar } from '@/components/screen-top-bar';

export default function ProfileScreen() {
    const { user, userProfile, signOut } = useAuthStore();
    const [stats, setStats] = useState({ sales: 0, products: 0, customers: 0 });

    useEffect(() => {
        loadStats();
    }, [user]);

    const loadStats = async () => {
        if (!user?.uid) return;
        try {
            const workspaceId = user.activeWorkspaceId;
            if (!workspaceId) return;

            const [salesSnap, productsSnap, customersSnap] = await Promise.all([
                dbGet(dbRef(rtdb, `workspaces/${workspaceId}/bills`)),
                dbGet(dbRef(rtdb, `workspaces/${workspaceId}/products`)),
                dbGet(dbRef(rtdb, `workspaces/${workspaceId}/customers`)),
            ]);

            const sales = salesSnap.exists() ? Object.values(salesSnap.val()).reduce((sum: number, bill: any) => sum + (bill.total || 0), 0) : 0;
            const products = productsSnap.exists() ? Object.keys(productsSnap.val()).length : 0;
            const customers = customersSnap.exists() ? Object.keys(customersSnap.val()).length : 0;

            setStats({ sales, products, customers });
        } catch (e) {
            console.error(e);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.replace('/login');
    };

    const profileData = userProfile || user;
    const displayName = profileData?.ownerName || profileData?.displayName || 'User';
    const businessName = profileData?.businessName || 'My Business';
    const email = profileData?.email || 'No email';
    const phone = profileData?.phone || 'No phone';
    const address = profileData?.address || 'No address';
    const photoURL = profileData?.photoURL;

    const profileStats = [
        { label: 'Sales', value: `₹${(stats.sales / 1000).toFixed(1)}k` },
        { label: 'Products', value: stats.products.toString() },
        { label: 'Customers', value: stats.customers.toString() },
    ];

    const personalInfo = [
        { icon: Mail, label: 'Email', value: email },
        { icon: Phone, label: 'Phone', value: phone },
        { icon: Briefcase, label: 'Business', value: businessName },
        { icon: MapPin, label: 'Address', value: address },
    ];

    return (
        <View className="flex-1 bg-background">
            <ScreenTopBar>
                <View className="flex-row items-center justify-between">
                <Pressable onPress={() => router.back()} className="mr-3">
                    <ArrowLeft size={24} color="#ffffff" />
                </Pressable>
                <Text className="text-white text-xl font-bold" style={{ fontFamily: 'DMSans_700Bold' }}>
                    Profile
                </Text>
                <Pressable onPress={() => router.push('/settings')}>
                    <Settings size={24} color="#ffffff" />
                </Pressable>
                </View>
            </ScreenTopBar>

            <ScrollView className="flex-1 px-4">
                {/* Profile Card */}
                <View className="items-center mt-4 mb-6">
                    <View className="relative">
                        <View className="w-24 h-24 rounded-full bg-primary/30 items-center justify-center border-2 border-primary/50 overflow-hidden">
                            {photoURL ? (
                                <Image source={{ uri: photoURL }} className="w-full h-full" />
                            ) : (
                                <Text className="text-white text-3xl font-bold" style={{ fontFamily: 'DMSans_700Bold' }}>
                                    {getInitials(displayName)}
                                </Text>
                            )}
                        </View>
                        <Pressable className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full items-center justify-center border-2 border-background">
                            <Pencil size={14} color="#ffffff" />
                        </Pressable>
                    </View>
                    <Text className="text-white text-xl font-bold mt-3" style={{ fontFamily: 'DMSans_700Bold' }}>
                        {displayName}
                    </Text>
                    <Text className="text-text-secondary" style={{ fontFamily: 'DMSans_400Regular' }}>
                        {businessName}
                    </Text>
                </View>

                {/* Stats */}
                <View className="flex-row justify-between mb-6">
                    {profileStats.map((stat, index) => (
                        <View
                            key={index}
                            className="bg-surface rounded-2xl p-4 border border-border flex-1 mx-1 items-center"
                        >
                            <Text className="text-white text-lg font-bold" style={{ fontFamily: 'DMSans_700Bold' }}>
                                {stat.value}
                            </Text>
                            <Text className="text-text-muted text-xs mt-1" style={{ fontFamily: 'DMSans_400Regular' }}>
                                {stat.label}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Personal Info */}
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-text-secondary" style={{ fontFamily: 'DMSans_500Medium' }}>
                        Personal Info
                    </Text>
                    <Pressable>
                        <Text className="text-primary text-sm" style={{ fontFamily: 'DMSans_500Medium' }}>
                            Edit
                        </Text>
                    </Pressable>
                </View>

                {personalInfo.map((info, index) => (
                    <View
                        key={index}
                        className="bg-surface rounded-2xl p-4 border border-border mb-3 flex-row items-center"
                    >
                        <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center mr-3">
                            <info.icon size={18} color="#8b7cf7" />
                        </View>
                        <View>
                            <Text className="text-text-muted text-xs" style={{ fontFamily: 'DMSans_400Regular' }}>
                                {info.label}
                            </Text>
                            <Text className="text-white font-medium" style={{ fontFamily: 'DMSans_500Medium' }}>
                                {info.value}
                            </Text>
                        </View>
                    </View>
                ))}

                {/* Sign Out */}
                <Pressable
                    onPress={handleSignOut}
                    className="bg-accent-red/10 border border-accent-red/30 rounded-2xl py-4 items-center mt-4 mb-6"
                >
                    <View className="flex-row items-center">
                        <LogOut size={18} color="#ef4444" />
                        <Text className="text-accent-red font-medium ml-2" style={{ fontFamily: 'DMSans_500Medium' }}>
                            Sign Out
                        </Text>
                    </View>
                </Pressable>
            </ScrollView>
        </View>
    );
}