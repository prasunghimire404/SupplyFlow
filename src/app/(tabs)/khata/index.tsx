import { authService } from '@/services/auth.service';
import { rtdb } from '@/services/firebase';
import { router } from 'expo-router';
import { get as dbGet, ref as dbRef } from 'firebase/database';
import { AlertCircle, ChevronRight, Clock, Plus, Search } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ScreenTopBar } from '@/components/screen-top-bar';

interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number;
  settled: boolean;
}

export default function KhataScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalDues, setTotalDues] = useState(0);

  const user = authService.getCurrentUser();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    if (!user?.activeWorkspaceId) {
      setLoading(false);
      return;
    }
    try {
      const snap = await dbGet(dbRef(rtdb, `workspaces/${user.activeWorkspaceId}/customers`));
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          name: val.name,
          phone: val.phone,
          balance: val.balance || 0,
          settled: (val.balance || 0) <= 0,
        }));
        setCustomers(list);
        setTotalDues(list.reduce((sum: number, c: Customer) => sum + (c.balance > 0 ? c.balance : 0), 0));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = searchQuery
    ? customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery))
    : customers;

  const activeCustomers = customers.filter(c => !c.settled).length;

  const getInitial = (name: string) => name.charAt(0).toUpperCase();
  const getColor = (name: string) => {
    const colors = ['#8b7cf7', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#8b5cf6'];
    return colors[name.charCodeAt(0) % colors.length];
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
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-2xl font-bold" style={{ fontFamily: 'DMSans_700Bold' }}>
              Khata
            </Text>
            <Text className="text-text-secondary text-sm" style={{ fontFamily: 'DMSans_400Regular' }}>
              Customer ledger & balances
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/khata/add-client' as any)}
            className="bg-primary rounded-xl px-4 py-2 flex-row items-center active:scale-95"
          >
            <Plus size={16} color="#ffffff" />
            <Text className="text-white font-medium text-sm ml-1" style={{ fontFamily: 'DMSans_500Medium' }}>
              Add Client
            </Text>
          </Pressable>
        </View>
      </ScreenTopBar>

      <ScrollView className="flex-1">
        {/* Stats */}
        <View className="flex-row px-4 mt-2 mb-4">
          <View className="bg-surface rounded-2xl p-4 border border-border flex-1 mx-1 items-center">
            <Text className="text-xl font-bold text-accent-red" style={{ fontFamily: 'DMSans_700Bold' }}>
              Rs {totalDues.toLocaleString()}
            </Text>
            <Text className="text-text-muted text-xs mt-1" style={{ fontFamily: 'DMSans_400Regular' }}>
              Total Dues
            </Text>
          </View>
          <View className="bg-surface rounded-2xl p-4 border border-border flex-1 mx-1 items-center">
            <Text className="text-xl font-bold text-white" style={{ fontFamily: 'DMSans_700Bold' }}>
              {activeCustomers}
            </Text>
            <Text className="text-text-muted text-xs mt-1" style={{ fontFamily: 'DMSans_400Regular' }}>
              Active Customers
            </Text>
          </View>
        </View>

        {/* Pending Cards */}
        <View className="flex-row px-4 mb-4">
          <Pressable
            onPress={() => router.push('/khata/pending-payments' as any)}
            className="bg-surface rounded-2xl p-4 border border-border flex-1 mx-1"
          >
            <View className="flex-row items-center mb-2">
              <Text className="text-text-secondary text-xs flex-1" style={{ fontFamily: 'DMSans_400Regular' }}>
                Pending Payments (DR)
              </Text>
              <Clock size={16} color="#8b7cf7" />
            </View>
            <Text className="text-lg font-bold text-accent-violet" style={{ fontFamily: 'DMSans_700Bold' }}>
              View
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/khata/pending-collections' as any)}
            className="bg-surface rounded-2xl p-4 border border-border flex-1 mx-1"
          >
            <View className="flex-row items-center mb-2">
              <Text className="text-text-secondary text-xs flex-1" style={{ fontFamily: 'DMSans_400Regular' }}>
                Pending Collection (CR)
              </Text>
              <AlertCircle size={16} color="#f43f5e" />
            </View>
            <Text className="text-lg font-bold text-accent-rose" style={{ fontFamily: 'DMSans_700Bold' }}>
              View
            </Text>
          </Pressable>
        </View>

        {/* Search */}
        <View className="px-4 mb-4">
          <View className="bg-surface-light rounded-xl px-4 py-3 border border-border flex-row items-center">
            <Search size={18} color="#6b7280" />
            <TextInput
              className="flex-1 ml-2 text-white"
              placeholder="Search customers..."
              placeholderTextColor="#6b7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ fontFamily: 'DMSans_400Regular' }}
            />
          </View>
        </View>

        {/* Customers List */}
        <View className="px-4 pb-6">
          {customers.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Text className="text-4xl mb-3">👥</Text>
              <Text className="text-text-secondary" style={{ fontFamily: 'DMSans_500Medium' }}>
                No customers yet
              </Text>
              <Text className="text-text-muted text-sm mt-1" style={{ fontFamily: 'DMSans_400Regular' }}>
                Add your first customer to start tracking
              </Text>
              <Pressable
                onPress={() => router.push('/khata/add-client' as any)}
                className="bg-primary rounded-xl px-6 py-3 mt-4"
              >
                <Text className="text-white font-medium" style={{ fontFamily: 'DMSans_500Medium' }}>
                  Add Client
                </Text>
              </Pressable>
            </View>
          ) : filtered.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Search size={32} color="#6b7280" />
              <Text className="text-text-secondary mt-3" style={{ fontFamily: 'DMSans_500Medium' }}>
                No customers found
              </Text>
            </View>
          ) : (
            filtered.map((customer) => {
              const color = getColor(customer.name);
              return (
                <Pressable
                  key={customer.id}
                  onPress={() => router.push(`/khata/${customer.id}` as any)}
                  className="bg-surface rounded-2xl p-4 border border-border mb-3 flex-row items-center active:scale-95"
                >
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: color + '30' }}
                  >
                    <Text className="text-white font-bold" style={{ fontFamily: 'DMSans_700Bold' }}>
                      {getInitial(customer.name)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-medium" style={{ fontFamily: 'DMSans_500Medium' }}>
                      {customer.name}
                    </Text>
                    <Text className="text-text-muted text-xs mt-1" style={{ fontFamily: 'DMSans_400Regular' }}>
                      {customer.phone}
                    </Text>
                  </View>
                  <View className="items-end">
                    <View className={`rounded-full px-3 py-1 ${customer.settled ? 'bg-surface-light' : 'bg-accent-red/20'}`}>
                      <Text className={`text-xs ${customer.settled ? 'text-text-muted' : 'text-accent-red'}`} style={{ fontFamily: 'DMSans_500Medium' }}>
                        {customer.settled ? 'Settled' : `₹${customer.balance.toLocaleString()} CR`}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color="#6b7280" className="ml-2" />
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}