# Setup Instructions for Welcome and Login Screens

## Required Assets

To complete the UI implementation, you need to add the following image to your `assets` folder:

### 1. World Map Background (`assets/world-map.png`)

This should be a subtle world map silhouette with a transparent or dark background. You can:

- **Option 1**: Download a world map PNG from free resources like:
  - Flaticon.com
  - Freepik.com
  - Unsplash.com (search "world map silhouette")
  
- **Option 2**: Create your own using design tools like:
  - Figma
  - Canva
  - Adobe Illustrator

**Recommended specifications:**
- Size: 1920x1080 pixels or similar
- Format: PNG with transparency
- Color: Dark gray or white silhouette
- Style: Simple, clean world map outline

### Temporary Workaround

If you don't have the world map image yet, you can:

1. Comment out the world map Image components in:
   - `src/screens/WelcomeScreen.js` (line ~28)
   - `src/screens/LoginScreen.js` (line ~50)

2. Or create a simple placeholder in your assets folder

## Testing the New Screens

1. Run your app: `npm start` or `expo start`
2. You should now see the Welcome screen first
3. Click "SIGN IN" to navigate to the new Login screen
4. Click "Sign up" links to navigate to SignUp screen

## Screen Flow

```
WelcomeScreen → LoginScreen → Home (after authentication)
              ↓
         SignUpScreen
```

## Features Implemented

### WelcomeScreen
- ✅ Dark gradient background matching the design
- ✅ Logo placeholder (using Ionicons)
- ✅ "Let's Get Started!" heading
- ✅ Primary SIGN IN button with gradient
- ✅ Social login icons (email/phone)
- ✅ Sign up link at bottom

### LoginScreen
- ✅ Dark gradient background
- ✅ "Welcome Back!" heading
- ✅ Email and Password inputs with icons
- ✅ Remember me checkbox
- ✅ Forgot Password link
- ✅ LOG IN button with gradient
- ✅ Sign up link
- ✅ Back button to return to Welcome screen

## Color Scheme

The new screens use a consistent purple/pink gradient theme:
- Primary: `#b366ff`
- Secondary: `#8b3dc7`
- Dark: `#1a1a3e`, `#2d2d5f`
- Background gradient: Dark blue tones

## Notes

- Both screens are fully responsive
- Theme toggle functionality is preserved
- All navigation is properly configured
- Keyboard avoiding view is implemented for better UX on mobile
