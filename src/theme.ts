export const palette = {
  bg: "#0E0F12",          // screen background
  card: "#16181D",        // card background
  text: "#E8EAED",
  subtext: "#9AA4AF",
  accent: "#2573FF",
  border: "rgba(255,255,255,0.06)",
};

export const radius = { 
  sm: 8, 
  md: 12, 
  lg: 16, 
  xl: 20 
};

export const space = { 
  xxs: 4, 
  xs: 8, 
  sm: 12, 
  md: 16, 
  lg: 20, 
  xl: 24 
};

export const shadow = {
  card: { 
    elevation: 6, 
    shadowOpacity: 0.18, 
    shadowRadius: 12, 
    shadowOffset: { width: 0, height: 8 } 
  }
};

export const icon = { size: 20 };  // social/action icons
export const avatar = { size: 52 }; // profile avatar

export const type = {
  title: { size: 16, weight: "700" as const, lineHeight: 20 },
  handle: { size: 14, weight: "600" as const, color: palette.subtext },
  bio: { size: 14, weight: "400" as const, color: palette.text },
};