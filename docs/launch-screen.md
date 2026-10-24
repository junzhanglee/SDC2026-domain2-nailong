# Nexus launch screen

Every new document load shows a short, full-screen introduction using the existing Nexus mark, a glass tile, soft blue/violet light and quiet orbital lines. In-app navigation does not replay it. A browser back/forward-cache restoration replays the introduction. Chinese, English and Bahasa Melayu use the last saved interface language, refreshed after the app applies the current profile's preferences.

The screen automatically dismisses after approximately 2.1 seconds once the workspace is ready. Reduced-motion users get a 350 ms introduction with animations disabled. The Enter Nexus button and Escape dismiss immediately. A 7.5-second fallback prevents an absent app-ready event from trapping the user. Behind-screen workspace controls are temporarily inert and restored on exit; keyboard focus returns to the workspace if it was within the introduction. The screen never clears sessions, resets business data or calls an external service.

`apps/web/assets/launch.css` owns the responsive visuals; `launch.js` runs independently of the app's module imports. The workspace dispatches `nexus:ready` after its initial render and localization. The launch screen is outside the normal page render, so later renders cannot restart its timer. Tests cover automatic entry, manual skip, Escape, fallback, reduced motion, locale fallback and back/forward restoration.
