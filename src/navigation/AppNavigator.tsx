import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Compass,
  LucideIcon,
  MessageSquare,
  Plus,
  UserCircle,
  Users,
} from "lucide-react-native";

import RadarScreen from "../screens/RadarScreen";
import PlaceholderScreen from "../screens/PlaceholderScreen";
import { ANIMATION, COLORS } from "../theme/colors";
import type { TabParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<keyof TabParamList, LucideIcon> = {
  Radar: Users,
  Feed: Compass,
  Create: Plus,
  Messages: MessageSquare,
  Profile: UserCircle,
};

const FeedScreen = () => <PlaceholderScreen label="Feed" />;
const CreateScreen = () => <PlaceholderScreen label="Create Post" />;
const MessagesScreen = () => <PlaceholderScreen label="Messages" />;
const ProfileScreen = () => <PlaceholderScreen label="Profile" />;

type TabBarItemProps = {
  route: BottomTabBarProps["state"]["routes"][number];
  descriptor: BottomTabBarProps["descriptors"][string];
  isFocused: boolean;
  navigation: BottomTabBarProps["navigation"];
};

const TabBarItem: React.FC<TabBarItemProps> = ({ route, descriptor, isFocused, navigation }) => {
  const translateAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const visualAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(translateAnim, {
      toValue: isFocused ? 1 : 0,
      duration: ANIMATION.tabTransition,
      useNativeDriver: true,
    }).start();

    Animated.timing(visualAnim, {
      toValue: isFocused ? 1 : 0,
      duration: ANIMATION.tabTransition,
      useNativeDriver: false,
    }).start();
  }, [isFocused, translateAnim, visualAnim]);

  const translateY = translateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });

  const overlayOpacity = visualAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const shadowOpacity = visualAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.35],
  });

  const shadowRadius = visualAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 18],
  });

  const elevation = visualAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });

  const animatedShadowStyle =
    Platform.select({
      ios: {
        shadowOpacity,
        shadowRadius,
      },
      default: {
        elevation,
      },
    }) ?? {};

  const rawLabel = descriptor.options.tabBarLabel ?? descriptor.options.title ?? route.name;
  const eventLabel = typeof rawLabel === "string" ? rawLabel : route.name;

  const IconComponent = ICONS[route.name as keyof TabParamList];

  const onPress = () => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const onLongPress = () => {
    navigation.emit({
      type: "tabLongPress",
      target: route.key,
    });
  };

  return (
    <Animated.View style={[styles.translateContainer, { transform: [{ translateY }] }]}>
      <Animated.View style={[styles.itemContainer, animatedShadowStyle]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.focusOverlay, { opacity: overlayOpacity }]}
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={descriptor.options.tabBarAccessibilityLabel ?? eventLabel}
          accessibilityState={isFocused ? { selected: true } : {}}
          onPress={onPress}
          onLongPress={onLongPress}
          style={styles.touchArea}
          activeOpacity={0.8}
        >
          <IconComponent color={COLORS.icon} size={24} strokeWidth={2} />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const FloatingTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: bottomInset }]}>
      <View style={styles.tabBarBackground} />
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => (
          <View key={route.key} style={styles.itemWrapper}>
            <TabBarItem
              route={route}
              descriptor={descriptors[route.key]}
              isFocused={state.index === index}
              navigation={navigation}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const AppNavigator: React.FC = () => (
  <Tab.Navigator
    initialRouteName="Radar"
    screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
    }}
    tabBar={(props) => <FloatingTabBar {...props} />}
  >
    <Tab.Screen name="Radar" component={RadarScreen} />
    <Tab.Screen name="Feed" component={FeedScreen} />
    <Tab.Screen name="Create" component={CreateScreen} />
    <Tab.Screen name="Messages" component={MessagesScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: COLORS.tabBackground,
    borderTopWidth: 1,
    borderTopColor: COLORS.tabBorder,
    gap: 4,
  },
  itemWrapper: {
    flex: 1,
    alignItems: "center",
  },
  translateContainer: {
    borderRadius: 18,
    alignItems: "center",
  },
  itemContainer: {
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.icon,
    shadowOffset: { width: 0, height: 0 },
  },
  focusOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    backgroundColor: COLORS.focusOverlay,
  },
  touchArea: {
    padding: 12,
  },
});

export default AppNavigator;
