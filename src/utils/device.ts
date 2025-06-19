/**
 * Device detection utilities for performance optimization
 */

export function detectDevice() {
	const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
	const isAndroid = /Android/.test(navigator.userAgent);
	const isMobile = window.innerWidth < 768; // Responsive breakpoint
	const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
	const isOldDevice = isIOS && window.devicePixelRatio <= 2; // iPhone 11 and older
	const isLowEndDevice =
		navigator.hardwareConcurrency <= 4 || window.devicePixelRatio <= 1.5;

	return {
		isIOS,
		isAndroid,
		isOldDevice,
		isMobile,
		isTablet,
		isLowEndDevice,
		devicePixelRatio: window.devicePixelRatio,
		hardwareConcurrency: navigator.hardwareConcurrency || 4,
	};
}

export function getOptimizedConfig(isOldDevice: boolean, isMobile = false) {
	// More aggressive optimizations for mobile
	const isSuperOptimized = isOldDevice || isMobile;

	return {
		// Throttling values - more aggressive on mobile
		wheelThrottle: isSuperOptimized ? 32 : isOldDevice ? 16 : 8,
		touchThrottle: isSuperOptimized ? 50 : isOldDevice ? 32 : 16,
		animationThrottle: isSuperOptimized ? 50 : isOldDevice ? 32 : 16,

		// Animation settings
		animationDuration: isSuperOptimized ? 0.15 : isOldDevice ? 0.2 : 0.3,

		// Event listener settings
		usePassiveTouch: isSuperOptimized,

		// Query limits - much more restrictive on mobile
		maxThumbnails: isSuperOptimized ? 15 : isOldDevice ? 20 : 50,
		maxProjects: isSuperOptimized ? 8 : isOldDevice ? 10 : 30,

		// CSS optimizations
		useWillChange: !isSuperOptimized,

		// Mobile-specific optimizations
		reduceImageQuality: isMobile,
		limitVisibleCells: isMobile,
		disableComplexAnimations: isSuperOptimized,
		maxVisibleCells: isSuperOptimized ? 20 : 50,

		// Grid optimizations for mobile
		mobileGridLimit: isMobile ? 50 : 200,
		mobileCellSize: isMobile ? 250 : 350,
		mobileBuffer: isMobile ? 1 : 2,
	};
}
