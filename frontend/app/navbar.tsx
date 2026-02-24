import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons"; // Icons (like Lucide)

type NavItem = {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  primary?: boolean;
};

const navItems: NavItem[] = [
  { id: "home", icon: "home", label: "Home" },
  { id: "map", icon: "map", label: "Map" },
  { id: "scan", icon: "camera", label: "Report", primary: true },
  { id: "jobs", icon: "briefcase", label: "Jobs" },
  { id: "rewards", icon: "gift", label: "Rewards" },
];

const routeMap: Record<string, string> = {
  home: "/screens/home",
  map: "/screens/map",
  scan: "/screens/scan",
  jobs: "/screens/jobs",
  rewards: "/screens/rewards",
};

interface NavbarProps {
  currentView: string;
  setCurrentView?: (view: string) => void; // optional if you want state in parent
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView }) => {
  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;

  return (
    <View style={[styles.navbar, { width: screenWidth }]}>
      
      {navItems.map((item) => {
        const isActive = currentView === item.id;

        const handlePress = () => {
          if (setCurrentView) setCurrentView(item.id);
          router.push(routeMap[item.id] as any);
        };

        return (
          <TouchableOpacity
            key={item.id}
            onPress={handlePress}
            activeOpacity={0.8}
            style={[styles.button, item.primary ? styles.primaryButton : null]}
          >
            {item.primary ? (
              <View style={styles.primaryIconContainer}>
                <Feather name={item.icon} size={28} color="#27272A" />
              </View>
            ) : (
              <View style={styles.iconContainer}>
                <Feather
                  name={item.icon}
                  size={22}
                  color={isActive ? "#A3E635" : "#A1A1AA"}
                />
                <Text style={[styles.label, isActive ? styles.activeLabel : null]}>
                  {item.label}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#18181B",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 100,
  },
  button: {
    flex: 1,
    alignItems: "center",
  },
  iconContainer: {
    alignItems: "center",
    gap: 2,
  },
  label: {
    fontSize: 10,
    color: "#A1A1AA",
    fontWeight: "500",
  },
  activeLabel: {
    color: "#A3E635",
  },
  primaryButton: {
    marginTop: -24,
  },
  primaryIconContainer: {
    backgroundColor: "#A3E635",
    padding: 14,
    borderRadius: 9999,
    borderWidth: 4,
    borderColor: "#18181B",
    shadowColor: "#A3E635",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});

export default Navbar;