# Hi-Tech Fuel Automate: Intervention Report Web App
**Project Overview & Features**

## 🚀 1. Project Initialization & Architecture
The project was built from scratch as a modern, high-performance web application tailored to exactly match the provided architectural blueprints.
- **Framework**: React.js
- **Build Tool**: Vite (for ultra-fast Hot Module Replacement and optimized production builds)
- **Styling**: Tailwind CSS v3
- **Local Storage**: Utilized browser `localStorage` for persisting report states (e.g., auto-incrementing Report ID).

## 🎨 2. Theming & UI Adjustments
- **Custom Branding**: Integrated the requested brand color (`#1F4E79` - deep blue) as the global `primary` color for accents, borders, and signature strokes.
- **Light Theme Migration**: Transitioned the entire application from a dark industrial theme to a clean, crisp, white/light-grey theme (`bg-slate-50` body, `bg-white` cards) for a highly professional and readable form appearance.
- **Responsive Layout**: Reconfigured the UI into a streamlined single-column layout centered on the screen (`max-w-4xl`), ensuring it works flawlessly on desktops, tablets, and phones.

## 🛠️ 3. Core Features & Components

### Form Sections
The form contains all the requested data fields, broken into logical `<fieldset>` components:
- **Report Metadata**: Automatically pulls the current system date and assigns an auto-incrementing Report ID (`RPT-00000X`). 
- **Safety Ticket**: A comprehensive Yes/No toggle section.
- **Client Information**: Standard text inputs for client details.
- **Service Type**: A standard dropdown menu for single-selection service types (with an "Others" specify input).
- **Job Status**: A standard dropdown menu (`<select>`).
- **Equipment Details**: A responsive grid of checkboxes for quick equipment tagging.
- **Work Performed & Test Results**: Re-engineered using a custom **Multi-Select Dropdown Component**. This allows users to cleanly select multiple items from a dropdown without cluttering the screen.
- **Parts / Materials Used**: A dynamic, table-like interface where technicians can seamlessly add or remove rows for parts used.

### Dual Interactive Signatures (`<SignaturePad>`)
- Implemented an interactive HTML5 `<canvas>` component to capture drawn signatures.
- **Technician & Customer**: Two distinct signature blocks are provided side-by-side.
- The canvases natively support mouse, touch, and stylus input.
- Includes a functional "Clear ✕" button to reset the drawing.

## 🖨️ 4. Advanced Print Optimization
The application was aggressively optimized to guarantee that exported PDFs perfectly fit onto a **single A4 page**:
- **Print Media Queries (`@media print`)**: 
  - Automatically hides all unnecessary UI elements (ActionBar, navigation header, placeholders).
  - Strips out all backgrounds and box-shadows, reverting all text to `black` to guarantee crystal-clear printing on paper.
- **Smart Data Compression**:
  - Unchecked items in "Equipment Details" and the "Safety Ticket" are entirely hidden from the printed document.
  - The Multi-Select dropdowns transform into a simple, flat list showing *only* the options that the user explicitly selected.
- **Signature Rendering**: Canvas elements cannot normally be printed. When clicking print, the app dynamically captures the signature as a base64 image (`toDataURL`) and swaps it in perfectly so it renders on the PDF.
- **Dynamic File Naming**: When you click "Print / Save PDF", the app temporarily renames the browser window title to exactly match the report ID (e.g., `HiTech_Intervention_Report_RPT-000001.pdf`). This forces the OS to automatically organize the saved files.

## 📂 5. File Structure
```text
Hi_Tech_Intervention_report/
├── index.html                  # Main HTML entry point
├── package.json                # Project dependencies and Vite scripts
├── postcss.config.js           # Tailwind PostCSS configuration
├── tailwind.config.js          # Tailwind theme configuration (custom primary color)
└── src/
    ├── main.jsx                # React root rendering
    ├── App.jsx                 # Main application logic & form layout
    ├── index.css               # Global CSS + Advanced @media print overrides
    ├── config.js               # Centralized lists (Test results, safety items, etc.)
    └── components/
        ├── Header.jsx                      # Navigation header
        ├── form/MultiSelectDropdown.jsx    # Custom dropdown for array selections
        └── signatures/SignaturePad.jsx     # Reusable canvas drawing logic
```
