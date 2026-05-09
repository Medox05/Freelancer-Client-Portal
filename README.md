# Freelancer-Client Portal

A comprehensive, real-time Freelancer-Client Management Portal built as a *Projet de Fin d'Études* (PFE). This platform enables seamless collaboration between freelancers and their clients through project tracking, live messaging, file sharing, and integrated video calls.

## ✨ Key Features

* **Real-time Video Calls:** Integrated face-to-face video meetings directly in the browser using WebRTC.
* **Live Chat & Messaging:** Instant messaging system between freelancers and clients.
* **Project & Task Management:** Track project milestones, deadlines, budgets, and overall progress.
* **File Sharing:** Securely upload, organize, and download project deliverables and assets.
* **Client Dashboard:** A dedicated space for clients to view active projects, approve milestones, and track progress.
* **Freelancer Dashboard:** Tools for managing multiple clients, tracking earnings, and organizing communication.

## 🛠️ Tech Stack

### Frontend
* **React** (Vite)
* **TypeScript**
* **Tailwind CSS** (for styling)
* **Framer Motion** (for smooth animations)
* **PeerJS / WebRTC** (for video calls)
* **React Query** (for data fetching and state management)

### Backend
* **Laravel** (PHP Framework)
* **MySQL** (Database)
* **Laravel Sanctum** (Authentication)

## 🚀 Deployment 

This application is configured to be deployed using:
* **Frontend:** Vercel
* **Backend:** Railway (Laravel web service)
* **Database:** Railway (MySQL Plugin)

## 💻 Local Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/Medox05/Freelancer-Client-Portal.git
cd Freelancer-Client-Portal
```

### 2. Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Update your .env with your local MySQL database credentials
php artisan migrate --seed
php artisan serve
```

### 3. Frontend Setup
```bash
cd frontend
npm install
# Ensure you have an .env file with VITE_API_URL=http://localhost:8000/api
npm run dev
```

Your frontend should now be running on `http://localhost:5173`.
