// Responsive breakpoints and utilities
export const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

// Helper function to check if current screen size matches breakpoint
export const useMediaQuery = (breakpoint) => {
  if (typeof window === 'undefined') return false;
  
  const query = `(min-width: ${BREAKPOINTS[breakpoint]}px)`;
  return window.matchMedia(query).matches;
};

// Responsive spacing utilities
export const SPACING = {
  mobile: {
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  },
  tablet: {
    xs: 'p-3',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  },
  desktop: {
    xs: 'p-4',
    sm: 'p-6',
    md: 'p-8',
    lg: 'p-10',
    xl: 'p-12'
  }
};

// Responsive text sizes
export const TEXT_SIZES = {
  mobile: {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  },
  desktop: {
    xs: 'text-sm',
    sm: 'text-base',
    base: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl'
  }
};

// Navigation dimensions
export const NAV_DIMENSIONS = {
  sidebar: {
    width: 'w-64', // 256px
    mobileWidth: 'max-w-xs', // 320px max
    height: 'h-screen',
    headerHeight: 'h-16' // 64px
  },
  hamburger: {
    size: 'h-6 w-6',
    padding: 'p-2',
    buttonSize: 'h-10 w-10'
  },
  topBar: {
    height: 'h-16', // 64px
    padding: 'px-4 lg:px-6'
  }
};

// Z-index layers
export const Z_INDEX = {
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  popover: 50,
  tooltip: 60
};

// Common responsive classes
export const RESPONSIVE_CLASSES = {
  container: 'mx-auto px-4 sm:px-6 lg:px-8',
  grid: {
    responsive: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    twoCol: 'grid grid-cols-1 lg:grid-cols-2',
    threeCol: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  },
  flex: {
    responsive: 'flex flex-col sm:flex-row',
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between'
  },
  text: {
    responsive: 'text-sm sm:text-base lg:text-lg',
    heading: 'text-lg sm:text-xl lg:text-2xl xl:text-3xl'
  }
};

// Mobile-first responsive design helpers
export const getResponsiveClass = (mobile, tablet = mobile, desktop = tablet) => {
  return `${mobile} md:${tablet} lg:${desktop}`;
};

// Check if device is mobile
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < BREAKPOINTS.md;
};

// Check if device is tablet
export const isTablet = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.md && window.innerWidth < BREAKPOINTS.lg;
};

// Check if device is desktop
export const isDesktop = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.lg;
}; 