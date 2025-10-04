import React, { useMemo, useState } from 'react';
import { FlatList, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '../src/components/AppHeader';
import Navigation from '../src/components/Navigation';
import { SearchDropdown } from '../src/components/SearchDropdown';
import { SocialProfileCard } from '../src/components/SocialProfileCard';
import VisibilitySheet from '../src/components/VisibilitySheet';
import { NEARBY_USERS } from '../src/constants/nearbyUsers';
import { useVisibility } from '../src/contexts/VisibilityContext';

const RadarScreen: React.FC = () => {
  const { selectedAccounts } = useVisibility();
  const [isSearchVisible, setSearchVisible] = useState(false);
  const [isSheetVisible, setSheetVisible] = useState(false);
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();

  const lowerQuery = query.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!lowerQuery) {
      return NEARBY_USERS;
    }
    return NEARBY_USERS.filter((user) => {
      return (
        user.name.toLowerCase().includes(lowerQuery) ||
        user.username.toLowerCase().includes(lowerQuery)
      );
    });
  }, [lowerQuery]);

  const dropdownItems = useMemo(
    () =>
      NEARBY_USERS.map((user) => ({
        id: user.id,
        title: user.name,
        subtitle: `@${user.username}`,
      })).filter((item) =>
        lowerQuery ? item.title.toLowerCase().includes(lowerQuery) || item.subtitle.toLowerCase().includes(lowerQuery) : true,
      ),
    [lowerQuery],
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <AppHeader
          onToggleSearch={() => setSearchVisible((prev) => !prev)}
          onOpenVisibility={() => setSheetVisible(true)}
        />
      </SafeAreaView>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SocialProfileCard user={item} selectedAccounts={selectedAccounts} />
        )}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 160 + Math.max(insets.bottom, 12),
        }}
        showsVerticalScrollIndicator={false}
      />

      <Navigation activePath="/radar" />

      <SearchDropdown
        visible={isSearchVisible}
        value={query}
        onChangeText={setQuery}
        onClose={() => setSearchVisible(false)}
        items={dropdownItems}
        onSelect={(item) => {
          setQuery(item.title);
          setSearchVisible(false);
        }}
      />

      <VisibilitySheet visible={isSheetVisible} onRequestClose={() => setSheetVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    backgroundColor: '#000000',
  },
});

export default RadarScreen;
