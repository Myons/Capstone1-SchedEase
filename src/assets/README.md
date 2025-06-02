# Assets Directory Structure

This directory contains all static assets for the SchedEase application.

## Directory Structure

```
assets/
├── images/           # For all image files
│   ├── logos/       # Application logos
│   ├── icons/       # Custom icons (if not using Lucide icons)
│   ├── backgrounds/ # Background images
│   └── avatars/     # User/profile avatars
├── fonts/           # Custom fonts (if not using Google Fonts)
└── other/           # Other static assets
```

## Usage Guidelines

1. Image formats:
   - Use SVG for logos and icons when possible
   - Use WebP for photos with JPG fallback
   - Use PNG for images requiring transparency
   - Optimize all images before adding them

2. Naming convention:
   - Use lowercase
   - Use hyphens for spaces
   - Be descriptive: `hero-background-dark.webp`

3. Import example:
```jsx
import logoImage from '../assets/images/logos/schedease-logo.svg';
```

## Best Practices

1. Keep images optimized for web use
2. Use appropriate image formats
3. Consider lazy loading for large images
4. Maintain consistent naming conventions 