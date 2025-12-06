# Dark Mode Implementation Guide

## Overview
A comprehensive dark mode with blue color scheme has been implemented throughout the Gujarat Innovation Hub app with a toggle feature.

## Features Implemented

### 1. Theme Context (`src/context/ThemeContext.js`)
- **Light Theme**: White backgrounds with purple-blue gradients (#667eea, #764ba2)
- **Dark Theme**: Dark blue backgrounds (#0f1419, #1a202c, #2d3748) with blue accents (#4299e1)
- **Theme Toggle**: Persistent theme preference saved in AsyncStorage
- **Automatic Theme Loading**: Theme preference loads on app start

### 2. Color Schemes

#### Light Theme Colors
- Primary: `#667eea` (Purple-Blue)
- Background: `#f5f7fa` (Light Gray)
- Surface: `#ffffff` (White)
- Text: `#2d3748` (Dark Gray)
- Gradients: Purple-Blue combinations

#### Dark Theme Colors
- Primary: `#4299e1` (Bright Blue)
- Background: `#0f1419` (Very Dark Blue)
- Surface: `#1a202c` (Dark Blue-Gray)
- Card: `#2d3748` (Medium Blue-Gray)
- Text: `#e2e8f0` (Light Gray)
- Gradients: Dark blue combinations

### 3. Components Updated

#### Login Screen (`src/screens/LoginScreen.js`)
- ✅ Theme toggle button (moon/sun icon) in top-right corner
- ✅ Dynamic gradient background based on theme
- ✅ Card backgrounds adapt to theme
- ✅ Text inputs styled with theme colors
- ✅ Button colors update with theme
- ✅ All text elements use theme colors

#### Profile Screen (`src/screens/ProfileScreen.js`)
- ✅ Dark mode toggle switch in Settings section
- ✅ Header gradient adapts to theme
- ✅ All cards use theme colors
- ✅ Text elements styled with theme
- ✅ Theme preference persists across sessions

#### Navigation (`src/navigation/AppNavigator.js`)
- ✅ Tab bar colors update with theme
- ✅ Drawer navigation styled with theme
- ✅ All stack navigators use theme colors
- ✅ Header backgrounds use primary theme color
- ✅ NavigationContainer uses custom theme

#### App Entry (`App.js`)
- ✅ ThemeProvider wraps entire app
- ✅ StatusBar configured for light content

### 4. Theme Toggle Component (`src/components/ThemeToggle.js`)
Reusable component that can be added to any screen:
```javascript
import ThemeToggle from '../components/ThemeToggle';

// Usage in screen
<ThemeToggle />
```

## How to Use

### In a Screen Component
```javascript
import { useTheme } from '../context/ThemeContext';

function MyScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>Hello World</Text>
      <Button onPress={toggleTheme}>Toggle Theme</Button>
    </View>
  );
}
```

### Styling Guidelines

1. **Always use theme colors instead of hardcoded values:**
   ```javascript
   // ❌ Bad
   backgroundColor: '#ffffff'
   
   // ✅ Good
   backgroundColor: theme.colors.surface
   ```

2. **Apply theme to all text elements:**
   ```javascript
   <Text style={{ color: theme.colors.text }}>Main Text</Text>
   <Text style={{ color: theme.colors.textSecondary }}>Secondary Text</Text>
   ```

3. **Use theme gradients for LinearGradient:**
   ```javascript
   <LinearGradient
     colors={isDarkMode ? theme.gradients.dark : theme.gradients.primary}
   >
   ```

4. **Apply theme to cards and surfaces:**
   ```javascript
   <Card style={{ backgroundColor: theme.colors.card }}>
   ```

## Theme Properties Reference

### Colors
- `primary` - Main accent color
- `secondary` - Secondary accent
- `background` - Main background
- `surface` - Component backgrounds
- `card` - Card backgrounds
- `text` - Primary text
- `textSecondary` - Secondary text
- `border` - Border color
- `error`, `success`, `warning`, `info` - Status colors
- `placeholder` - Input placeholder color
- `disabled` - Disabled state color

### Gradients
- `primary` - Main gradient array
- `secondary` - Secondary gradient array
- `dark` - Dark gradient array

### Spacing
- `xs`, `sm`, `md`, `lg`, `xl` - Standard spacing values

### Border Radius
- `sm`, `md`, `lg`, `xl` - Standard border radius values

## Where Theme Toggle Appears

1. **Login Screen**: Top-right corner toggle button
2. **Profile Screen**: Settings section with labeled switch
3. **Any Screen**: Can add `<ThemeToggle />` component

## Persistence

Theme preference is automatically saved to device storage using AsyncStorage and will persist:
- ✅ Between app sessions
- ✅ After app restart
- ✅ After device restart

## Testing Checklist

- [ ] Toggle theme on Login screen
- [ ] Navigate through app and verify all screens update
- [ ] Toggle theme in Profile settings
- [ ] Close and reopen app - theme should persist
- [ ] Check all text is readable in both themes
- [ ] Verify all buttons are visible in both themes
- [ ] Test navigation headers in both themes
- [ ] Check tab bar in both themes

## Next Steps for Full Implementation

To apply dark mode to remaining screens:

1. Import theme in each screen:
   ```javascript
   import { useTheme } from '../context/ThemeContext';
   const { theme, isDarkMode } = useTheme();
   ```

2. Update StyleSheet to use theme colors:
   ```javascript
   <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
   ```

3. Update all hardcoded colors to use theme properties

4. Test each screen in both light and dark modes

## Troubleshooting

**Theme not persisting:**
- Ensure AsyncStorage is properly installed: `@react-native-async-storage/async-storage`

**Colors not updating:**
- Verify component is wrapped in ThemeProvider
- Check that theme hook is being used correctly

**Text not visible:**
- Make sure all text elements use `theme.colors.text` or `theme.colors.textSecondary`
