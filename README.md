# Emergency SOS – SafeSignal (Web Application)

SafeSignal is a modern, responsive Progressive Web Application (PWA) designed to provide instant emergency alert capabilities across mobile phones, tablets, and desktop computers.

## Core Features & Technical Specification

1. **Large High-Contrast SOS Panic Button**: Styled according to stress-resilient UI principles for rapid recognition.
2. **5-Second Cancellation Safeguard**: Displays a prominent 5-second countdown timer upon pressing SOS, allowing the user to cancel accidental triggers.
3. **Emergency Contacts Management**: Save, edit, and delete multiple trusted contacts stored offline in the browser's `localStorage`.
4. **On-Demand Geolocation API Integration**: Retrieves user coordinates (Latitude/Longitude) via `navigator.geolocation` when an SOS alert is triggered or when explicitly refreshed.
5. **Universal Google Maps Link Generation**: Dynamically formats coordinates into cross-platform Google Maps URLs (`maps.google.com/?q=LAT,LNG`).
6. **Web Share API & Native SMS Fallback**: Utilizes `navigator.share` to dispatch structured emergency messages. If Web Share is unsupported, opens the native messaging app (`sms:`) pre-populated with recipient numbers and copies the text to the clipboard.
7. **One-Tap Direct Calling**: Dedicated call buttons (`tel:`) for immediate dialling of emergency contacts.
8. **Installable Progressive Web App (PWA)**: Includes a valid W3C Web App Manifest (`manifest.webmanifest`) and Service Worker (`sw.js`) for home screen installation and offline caching.

---

## Important Web Browser & Security Limitations

* **No Automated Background SMS**: Modern web browsers sandbox web applications and forbid automated background SMS transmission without explicit user interaction. SafeSignal constructs the alert text and opens the native system share/SMS application.
* **Explicit Geolocation Permission**: Location retrieval requires explicit user approval via native browser permission dialogs.
* **No Lock-Screen Volume Key Hooks**: Web applications running in standard browsers cannot listen to physical volume button hardware keys while the device screen is locked or the browser is minimized.

---

## Project Directory Structure

```text
safesignal-sos/
├── index.html            # Main HTML5 Document & UI Structure
├── style.css             # Modern Red/White/Light-Grey Responsive Styling
├── app.js                # Core JS Logic (Geolocation, LocalStorage, Timer, Share)
├── manifest.webmanifest  # PWA Manifest Configuration
├── sw.js                 # Service Worker for Offline Caching
├── README.md             # Project Documentation & Usage Guide
└── icons/
    ├── icon-192.png      # 192x192 PWA App Icon
    └── icon-512.png      # 512x512 PWA App Icon
```

---

## How to Run Locally

Because Geolocation APIs and Service Workers require a secure origin (`HTTPS` or `http://localhost`), launch the project using a local server:

### Option 1: Python HTTP Server (Built-in)
```bash
cd safesignal-sos
python3 -m http.server 8000
```
Then navigate to `http://localhost:8000` in your web browser.

### Option 2: VS Code Live Server Extension
1. Open the `safesignal-sos` folder in VS Code.
2. Install the **Live Server** extension.
3. Click **"Go Live"** at the bottom status bar.

---

## How to Publish via GitHub Pages

1. Initialize Git and commit all project files:
   ```bash
   git init
   git add .
   git commit -m "Initial release of SafeSignal SOS Web App"
   ```
2. Create a new public repository on GitHub named `safesignal-sos`.
3. Add remote origin and push code:
   ```bash
   git branch -M main
   git remote add origin git@github.com:YOUR_USERNAME/safesignal-sos.git
   git push -u origin main
   ```
4. Enable GitHub Pages:
   * Go to **Settings → Pages** in your GitHub repository.
   * Under **Build and deployment**, set **Source** to `Deploy from a branch`.
   * Select `main` branch and `/ (root)` folder.
   * Click **Save**.
5. Your application will be published on your GitHub Pages site.

---

## Final Testing Checklist

- [ ] **Contact Management**: Add, edit, and delete contacts. Refresh page and verify contacts persist in `localStorage`.
- [ ] **SOS 5-Second Countdown**: Press SOS button and verify countdown ticks down from 5 to 0. Tap "CANCEL" to ensure alert stops.
- [ ] **On-Demand Location Access**: Verify location permission dialog appears upon SOS activation or tapping "Refresh GPS".
- [ ] **Google Maps Link**: Ensure coordinates correctly launch Google Maps.
- [ ] **Alert Dispatch**: Verify Web Share sheet opens (on mobile) or SMS scheme launches (on desktop/mobile fallback).
- [ ] **Direct Call Buttons**: Verify tapping "📞 Call" opens device phone dialler with pre-filled number.
- [ ] **PWA Audit**: In Chrome DevTools → Application tab, check that Service Worker is registered and Manifest loads cleanly.
