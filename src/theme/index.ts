import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

// Custom theme configuration for Amiga Fertility
const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        // Brand orange palette
        brand: {
          50: { value: "#FFF5F2" },
          100: { value: "#FFE8E0" },
          200: { value: "#FFD1C1" },
          300: { value: "#FFBA9F" },
          400: { value: "#F89A6F" },
          500: { value: "#E67449" }, // Primary brand orange
          600: { value: "#D55A35" },
          700: { value: "#B94524" },
          800: { value: "#8F3318" },
          900: { value: "#6B240F" },
        },
        // Purple accent
        purple: {
          50: { value: "#F5F1F7" },
          100: { value: "#E5DCE9" },
          200: { value: "#C9B8D2" },
          300: { value: "#AD95BA" },
          400: { value: "#8C6C96" },
          500: { value: "#6B4D78" }, // Deep purple accent
          600: { value: "#553D60" },
          700: { value: "#402D48" },
          800: { value: "#2B1E30" },
          900: { value: "#160F18" },
        },
        // Cream background
        cream: {
          50: { value: "#FDFBF9" },
          100: { value: "#FAF7F3" },
          200: { value: "#F4EDE3" }, // Warm background
          300: { value: "#EDE3D3" },
          400: { value: "#E5D9C3" },
          500: { value: "#DDCFB3" },
          600: { value: "#C5B89A" },
          700: { value: "#ADA181" },
          800: { value: "#8A806A" },
          900: { value: "#675F52" },
        },
      },
      fonts: {
        heading: { value: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` },
        body: { value: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` },
      },
    },
    semanticTokens: {
      colors: {
        // Background colors
        "bg.canvas": {
          value: { base: "{colors.cream.200}", _dark: "{colors.gray.900}" },
        },
        "bg.surface": {
          value: { base: "white", _dark: "{colors.gray.800}" },
        },
        "bg.sidebar": {
          value: { base: "{colors.brand.500}", _dark: "{colors.brand.700}" },
        },
        "bg.sidebar.hover": {
          value: { base: "{colors.brand.600}", _dark: "{colors.brand.800}" },
        },
        // Text colors
        "text.primary": {
          value: { base: "{colors.gray.900}", _dark: "{colors.gray.100}" },
        },
        "text.secondary": {
          value: { base: "{colors.gray.600}", _dark: "{colors.gray.400}" },
        },
        "text.muted": {
          value: { base: "{colors.gray.500}", _dark: "{colors.gray.500}" },
        },
        "text.inverted": {
          value: { base: "white", _dark: "{colors.gray.900}" },
        },
        // Border colors
        "border.default": {
          value: { base: "{colors.gray.200}", _dark: "{colors.gray.700}" },
        },
        "border.emphasized": {
          value: { base: "{colors.gray.300}", _dark: "{colors.gray.600}" },
        },
      },
    },
  },
  globalCss: {
    body: {
      bg: "bg.canvas",
      color: "text.primary",
    },
  },
})

// Create and export the custom system
export const system = createSystem(defaultConfig, customConfig)
