# AirGapKit – The Ultimate Offline Toolkit

<p align="center">
  <img src="https://raw.githubusercontent.com/tomsec8/AirGapKit/main/chrome-mv3/icon/128.png" alt="AirGapKit Icon" width="128" />
</p>

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**A comprehensive, privacy-first productivity suite that transforms your browser into an offline powerhouse.**


Designed for professionals, students, and privacy-conscious users, AirGapKit provides a robust suite of over 20+ essential daily tools. From PDF manipulation and file conversion to image optimization—everything runs **100% locally** on your machine. No internet required. No cloud uploads. Complete privacy.

---

<p align="center">
  <br><br>
  <a href="https://chromewebstore.google.com/detail/airgapkit-%E2%80%94-offline-file/odenlfcjhkblnifbiepjkkimicajfllo">
    <picture>
      <source srcset="https://i.imgur.com/XBIE9pk.png" media="(prefers-color-scheme: dark)">
      <img height="58" src="https://i.imgur.com/oGxig2F.png" alt="Chrome Web Store">
    </picture>
  </a>
</p>



---

## ✨ Why AirGapKit?

*   **🔒 100% Offline (Air-Gapped):** Your files never leave your computer. All processing is strictly local within your browser's sandbox.
*   **⚡ Lightning Fast:** No waiting for files to upload or download from remote servers. Your device's CPU handles the heavy lifting instantly.
*   **🚫 Zero Tracking:** We do not collect analytics, telemetry, or user data. What happens on your machine, stays on your machine.
*   **🚀 Modern Stack:** Built purely with React, Vite, and WXT for maximum performance, minimal memory footprint, and top-tier security (0 known vulnerabilities).

---

## 🛠️ Key Features

### 📄 PDF Super-Tools
*   **Merge & Split:** Seamlessly combine multiple PDFs or extract specific pages.
*   **Compress:** Reduce PDF file sizes drastically without sacrificing readability.
*   **Encrypt & Decrypt:** Secure your documents with passwords or unlock them locally.
*   **Watermark & Sign:** Stamp text watermarks or append digital signatures.
*   **Extract:** Instantly pull raw text or images out of any PDF file.
*   **Reorder:** Intuitive drag-and-drop interface to rearrange or delete pages.

### 🔄 Universal Converters
*   **Office to PDF:** Convert Word (`.docx`), Excel (`.xlsx`), and PowerPoint (`.pptx`) files directly to PDF.
*   **PDF to Office/Image:** Convert PDFs back into editable formats or high-quality images.
*   **Webpage to PDF/Image:** Snapshot and save any webpage perfectly for offline viewing.
*   **SVG to Image:** Render scalable vector graphics into flat PNG/JPEG files.
*   **Media Extractor:** Extract raw assets from ZIP archives and document bundles.

### 🖼️ Image & Media Utilities
*   **Image Compressor:** Shrink image weights significantly while maintaining visual fidelity.
*   **AI Background Remover:** Local AI-powered background extraction (runs directly via WebAssembly/browser APIs).
*   **EXIF Editor:** View, modify, or completely strip hidden privacy metadata (GPS, device info) from your photos.
*   **Format Converter:** Cross-convert between PNG, JPEG, WEBP, and more.
*   **Resolution Changer:** Resize and scale images to exact pixel dimensions.

### 🔐 Security & Developer Tools
*   **Password Generator:** Craft highly secure, cryptographically strong passwords locally.
*   **JSON Formatter:** Validate, format, and beautify messy JSON strings instantly.

---

## 📥 Installation

**For Chrome / Edge / Brave (Chromium based):**
1. Download the latest release from the [Chrome Web Store](#) *(Link coming soon)*.
2. Alternatively, download the latest `.zip` from the [Releases](../../releases) tab, go to `chrome://extensions`, enable **Developer mode**, and drag-and-drop the file.

---

## ✅ System Requirements & Permissions

*   **Browser:** Chrome, Edge, Brave, or any Chromium-based browser.
*   **Internet Access:** Not required! Fully functional offline after initial installation.

**Requested Permissions:**
*   `storage` – To save your local UI preferences (e.g., Dark Mode state).
*   `downloads` – To save your processed files (PDFs, Images, ZIPs) securely back to your local filesystem.

---

## 🏗️ Build Instructions (For Developers)

This project is built on the [WXT](https://wxt.dev/) framework alongside React and Vite. 

**1. Clone the repository and install dependencies:**
```bash
git clone [https://github.com/yourusername/AirGapKit.git](https://github.com/yourusername/AirGapKit.git)
cd AirGapKit
npm install
```

**2. Run the development server:**
```bash
npm run dev
```

**3. Build the production ZIP (for Web Store distribution):**
```bash
npm run zip
```
*The compiled unpacked extension will be available in the `chrome-mv3` folder, and the final compressed archive will be located inside the `.output` directory.*

---

## 📦 Project Structure

```text
AirGapKit/
├── src/
│   ├── components/      # React UI Components (Tools, Layout, Shared)
│   ├── store/           # Zustand state management
│   ├── utils/           # Helper functions (Sanitization, File handling)
│   ├── App.tsx          # Main React Application entry
│   └── index.css        # Global styles & Tailwind utilities
├── public/              # Static assets (Icons, Workers, Fonts)
├── chrome-mv3/          # Compiled unpacked extension (Generated)
├── package.json         # Dependencies & scripts
├── wxt.config.ts        # WXT Manifest & Build configuration
└── README.md
```

---

## 🔒 Privacy Policy

*   **Client-Side Execution:** All file parsing, conversions, and metadata extractions are executed within your browser's isolated environment.
*   **No External APIs:** We do not rely on third-party cloud APIs to process your data.
*   **No Data Retention:** With no backend servers, zero data is transmitted, collected, or stored.

Read our complete [Privacy Policy](PRIVACY.md) for more technical details.

---

## 🤝 Credits & Libraries

This extension stands on the shoulders of excellent, heavily audited open-source libraries:
*   **pdf-lib** & **pdfjs-dist:** Robust PDF manipulation and rendering.
*   **jszip:** Efficient archive handling and Office document parsing.
*   **mammoth** & **docx:** Native Word document processing.
*   **piexifjs:** Direct EXIF metadata manipulation.
*   **lucide-react:** Clean, consistent iconography.
*   **zustand:** Lightweight and fast state management.
*   **WXT Framework:** Next-generation browser extension architecture.

---

### Maintainer 👨‍💻
Built with care for privacy, security, and true offline capability. Issues, feature requests, and pull requests are always welcome!

### License 📜
This project is licensed under the **GPL-3.0 License** - see the [LICENSE](LICENSE) file for details.
