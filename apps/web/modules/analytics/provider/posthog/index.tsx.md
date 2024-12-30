# Analytics Tracking Implementation

[Linked Table of Contents](#table-of-contents)

## Table of Contents <a name="table-of-contents"></a>

* [1. Overview](#overview)
* [2. `AnalyticsScript` Component](#analyticsscript-component)
* [3. `useAnalytics` Hook](#useanalytics-hook)
* [4.  PostHog Integration](#posthog-integration)


## 1. Overview <a name="overview"></a>

This document details the implementation of analytics tracking within the application using the PostHog analytics platform.  The implementation consists of two key components:  `AnalyticsScript`, a React component that initializes the PostHog library, and `useAnalytics`, a custom React hook providing a convenient interface for tracking events.  Both leverage environment variables for configuration and include error handling for cases where the PostHog key is missing.


## 2. `AnalyticsScript` Component <a name="analyticsscript-component"></a>

The `AnalyticsScript` component is responsible for initializing the PostHog library.  It utilizes the `useEffect` hook to ensure initialization occurs only once after the component mounts.

```javascript
export function AnalyticsScript() {
	useEffect(() => {
		if (!posthogKey) return;

		posthog.init(posthogKey, {
			// use eu.i.posthog.com for european users
			api_host: "https://i.posthog.com",
			person_profiles: "identified_only", // or 'always' to create profiles for anonymous users as well
		});
	}, []);
}
```

**Algorithm:**

1. **Check for PostHog Key:** The component first checks if the `posthogKey` environment variable is defined. If not, it immediately returns, preventing errors.
2. **Initialize PostHog:** If the key is present, the `posthog.init()` method is called, passing the key and configuration options.
3. **Configuration Options:** The `api_host` option specifies the PostHog API endpoint ("https://i.posthog.com" is used here; consider "eu.i.posthog.com" for European users). The `person_profiles` option is set to `"identified_only"`, meaning PostHog will only create user profiles for identified users.  This can be changed to `'always'` to create profiles for anonymous users as well.
4. **Empty Dependency Array:** The empty dependency array `[]` in `useEffect` ensures that the initialization runs only once upon the component's initial mount.


## 3. `useAnalytics` Hook <a name="useanalytics-hook"></a>

The `useAnalytics` hook provides a simple interface for tracking events within the application.

```javascript
export function useAnalytics() {
	const trackEvent = (event: string, data?: Record<string, unknown>) => {
		if (!posthogKey) return;

		posthog.capture(event, data);
	};

	return {
		trackEvent,
	};
}
```

**Algorithm:**

1. **Check for PostHog Key:** Similar to `AnalyticsScript`, this function first checks for the existence of the `posthogKey`. If it's missing, no action is taken.
2. **Track Event:** If the key exists, the `trackEvent` function uses `posthog.capture()` to send an event to PostHog.  The `event` parameter specifies the event name, and the optional `data` parameter allows for associating custom data with the event.
3. **Return `trackEvent` Function:** The hook returns an object containing the `trackEvent` function, allowing components to easily track events.


## 4. PostHog Integration <a name="posthog-integration"></a>

This implementation relies on the `posthog-js` library.  Ensure this library is installed (`npm install posthog-js`). The `NEXT_PUBLIC_POSTHOG_KEY` environment variable must be set with the actual PostHog project API key.  The `api_host` can be adjusted based on geographical location or other infrastructure needs.  The `person_profiles` setting offers a trade-off between data privacy and detailed user profile generation.  Consider the privacy implications when choosing between `"identified_only"` and `"always"`.  Appropriate error handling is included to prevent issues when the API key is missing.
