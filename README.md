<div align="center">
  <img src="Frontend/public/Royal  Blue TEW LOGO 001.jpg" alt="Total Engineering Works Logo" width="200" />
  
  # Total Engineering Works (TEW)
  **Precision Manufacturing. Intelligent Engineering.**
  
  [![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)](https://supabase.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
</div>

---

## 📖 Project Overview

**Total Engineering Works** is a modern, enterprise-grade digital platform built for a premier manufacturing facility. It bridges the gap between a high-authority public corporate presence and a powerful, offline-capable quoting and administrative backend.

The system is divided into two distinct parts:
1. **Frontend (Online):** A stunning, conversion-optimized Next.js B2B website. It showcases manufacturing capabilities, product catalogs, defense-sector certifications, and allows customers to instantly submit CAD/PDF files for RFQs (Request for Quotations).
2. **Backend (Offline/LAN):** A secure, local-first FastAPI application tailored for office staff. It manages RFQ lifecycles, parses 2D/3D CAD files (DXF/STEP) to calculate weight and laser cutting lengths, and automatically generates beautiful PDF cost estimates.

---

## ✨ Key Features

### 🌐 Public Frontend (Next.js)
- **High-End Corporate Design:** Dark-mode optimized, cinematic visuals powered by Framer Motion and Tailwind CSS.
- **Rich Product Catalog:** Showcases 40+ reference products across Machined Components, Sheet Metal, Electrical Panels, and Defense systems.
- **Automated RFQ System:** Customers can upload technical drawing packs securely. Files are routed directly to Supabase Storage.
- **AI Assistant Integration:** Context-aware chatbot built to answer 60+ common manufacturing and facility questions.

### ⚙️ Admin & Quote Engine (FastAPI)
- **Offline-First Security:** The core business tool runs entirely on the factory's local network (LAN), ensuring sensitive quoting logic never touches the public internet.
- **Automated CAD Processing:** Reads DXF/DWG/STEP files to automatically calculate material weight, perimeter cut length, and raw material costs.
- **Instant Quotation Generation:** Translates technical specs into beautiful, branded PDF estimate sheets in seconds.
- **Customer CRM:** Tracks RFQ history, quoting status, and client communication seamlessly.

---

## 🏗️ Architecture Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 15 (React 19)** | Public Website & UI |
| **FastAPI (Python 3.11+)** | Core Quote Engine & Admin API |
| **Supabase (PostgreSQL)** | Central Database & File Storage |
| **Tailwind CSS & Framer** | Styling & Micro-animations |
| **ezdxf & pythonocc** | CAD geometry analysis |

---

## 🚀 Getting Started

### 1. Frontend Development (Website)

```bash
cd Frontend
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
# The website will be available at http://localhost:3000
```

### 2. Backend Development (Quote Tool)

```bash
cd Backend/MetalQuoteTool-v5

# Create a virtual environment and install dependencies
pip install -r requirements.txt

# Copy environment variables and configure Supabase keys
cp .env.example .env

# Run the FastAPI server
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
# The local admin panel will be available at http://localhost:8000
```

---

## 🔒 Security & Deployment Architecture

- **Database:** Supabase PostgreSQL (Cloud) acts as the bridge between the public website and the local office.
- **File Storage:** Customer CAD files are uploaded securely to Supabase Storage buckets.
- **Admin Panel:** Designed to run securely on an internal office machine (`localhost:8000`), fetching RFQs from Supabase and pushing generated quotes back up, completely isolating business logic from public endpoints.

---
*Built for the future of manufacturing.*
