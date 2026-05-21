import { Symbol } from "@retardmaxxing/ui-native";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#5B5BD6",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Symbol name="house.fill" size={size} tintColor={color} fallback={null} />
          ),
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: "Billing",
          tabBarIcon: ({ color, size }) => (
            <Symbol name="creditcard.fill" size={size} tintColor={color} fallback={null} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Symbol name="person.crop.circle" size={size} tintColor={color} fallback={null} />
          ),
        }}
      />
    </Tabs>
  );
}
