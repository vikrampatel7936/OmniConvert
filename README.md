# 🔄 OmniConvert — Universal File Converter (GitHub Pages Edition)

OmniConvert is a 100% in-browser, client-side file conversion web application designed to run seamlessly on **GitHub Pages**, **Mobile Devices (iPhone & Android)**, and **Desktop Browsers** without needing any server, database, or backend installation!

---

## 📱 How to Publish on GitHub Pages (Use on Mobile)

### Step 1: Upload Files to GitHub
Create a new repository on GitHub (e.g. `file-converter`) and push the repository:

```bash
git init
git add .
git commit -m "Deploy OmniConvert on GitHub Pages"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git push -u origin main
```

> **Note**: For GitHub Pages, the essential files at the root of your repo are:
> - `index.html` (Main web app)
> - `style.css` (App styling & themes)
> - `app.js` (100% Client-side conversion engine)
> - `favicon.svg` (Icon)

### Step 2: Enable GitHub Pages in 3 Clicks
1. On your GitHub repository page, click **Settings** (gear icon at the top).
2. In the left sidebar, click **Pages**.
3. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: Select `main` and folder `/(root)`
4. Click **Save**.

Within 1 minute, GitHub will give you a live website link:
```text
https://<YOUR_USERNAME>.github.io/<YOUR_REPOSITORY_NAME>/
```

### Step 3: Open on Mobile
1. Open that link in **Safari (iOS)** or **Chrome (Android)** on your phone.
2. **Add to Home Screen**:
   - **iPhone**: Tap the Share button ➔ **Add to Home Screen**.
   - **Android**: Tap the 3-dots menu ➔ **Add to Home screen**.
3. Now you have a native-like File Converter app on your phone that converts files in real time!

---

## 🌟 Supported Conversions (100% Client-Side)

| Category | Input Format | Converted Output Formats |
| :--- | :--- | :--- |
| **📄 Documents** | **PDF** | **DOCX (Word)**, **TXT**, **HTML**, **Images (PNG, JPG)** |
| | **Word (`.docx`)** | **PDF**, **HTML**, **Markdown (`.md`)**, **TXT** |
| | **Markdown (`.md`)** | **Word (`.docx`)**, **HTML**, **PDF**, **TXT** |
| | **HTML / Plain Text** | **PDF**, **Word (`.docx`)**, **Markdown**, **HTML** |
| **📊 Sheets & Data** | **Excel (`.xlsx`, `.xls`)** | **CSV**, **JSON**, **HTML Table**, **PDF**, **XML**, **YAML** |
| | **CSV / TSV** | **Excel (`.xlsx`)**, **JSON**, **HTML Table**, **XML**, **YAML**, **PDF** |
| | **JSON** | **CSV**, **Excel (`.xlsx`)**, **XML**, **YAML** |
| | **XML / YAML** | **JSON**, **CSV**, **Excel (`.xlsx`)** |
| **🖼️ Images** | **PNG, JPG, WebP, GIF, BMP, SVG** | **PNG, JPG, WebP, BMP, ICO (Favicon), PDF** (with quality & resize controls) |
| **🎵 Audio** | **MP3, WAV, OGG, AAC, M4A** | **WAV (Lossless 16-bit PCM)** with browser player preview |
| **🛠️ Tools** | **Any File** | **Base64 Encoder/Decoder**, **QR Code Generator** |

---

## 🔒 100% Private & Secure
Every file is processed **inside your device's browser memory (RAM)** using WebAssembly and Web Standards. No files are ever sent over the internet or uploaded to any third-party server.
