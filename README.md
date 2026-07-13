# Freelancer-Client Portal

A comprehensive, real-time Freelancer-Client Management Portal built as a *Projet de Fin d'Études* (PFE). This platform enables seamless collaboration between freelancers and their clients through real-time communication, project management, and secure file sharing.

## ✨ Key Features

* **Real-time Video Calls:** Integrated face-to-face video meetings directly in the browser using WebRTC.
* **Live Chat & Messaging:** Instant messaging system between freelancers and clients.
* **Project & Task Management:** Track project milestones, deadlines, budgets, and overall progress.
* **File Sharing:** Securely upload, organize, and download project deliverables and assets.
* **Client Dashboard:** A dedicated space for clients to view active projects, approve milestones, and track progress.
* **Freelancer Dashboard:** Tools for managing multiple clients, tracking earnings, and organizing communication.

## 📸 Screenshots & Features Overview

### 1. **Authentication & User Registration**
![Authentication Screen](./screenshots/01-authentication.png)

**What it does:**
- Secure user registration and login for both freelancers and clients
- Email verification for account activation
- JWT token-based authentication using Laravel Sanctum
- Password reset functionality
- Role-based access control (Freelancer/Client)

---

### 2. **Freelancer Dashboard**
![Freelancer Dashboard](./screenshots/02-freelancer-dashboard.png)

**What it does:**
- Overview of all active projects and client engagements
- Real-time earnings tracking and payment statistics
- Quick access to ongoing projects and tasks
- Notifications for new messages and project updates
- Profile management and availability status
- Performance metrics and ratings from clients

---

### 3. **Client Dashboard**
![Client Dashboard](./screenshots/03-client-dashboard.png)

**What it does:**
- Centralized view of all active and completed projects
- Budget tracking and expense monitoring
- Project progress visualization with milestone tracking
- Quick actions to create new projects or communicate with freelancers
- Payment history and invoice management
- Performance reviews and freelancer ratings

---

### 4. **Project Management Interface**
![Project Management](./screenshots/04-project-management.png)

**What it does:**
- Create and manage projects with detailed descriptions
- Set milestones with specific deadlines and budgets
- Assign tasks to freelancers with priority levels
- Track project status (Not Started, In Progress, On Hold, Completed)
- View project timeline and dependencies
- Add project requirements and acceptance criteria
- Milestone approval workflow for clients

---

### 5. **Real-time Video Call Feature**
![Video Call Interface](./screenshots/05-video-call.png)

**What it does:**
- WebRTC-powered peer-to-peer video conferencing
- One-click video call initiation
- Screen sharing capabilities for discussions
- Call recording functionality (optional)
- Built-in call timer and participant information
- Audio/video toggle controls
- Call quality indicators

---

### 6. **Live Chat & Messaging System**
![Chat Interface](./screenshots/06-chat-messaging.png)

**What it does:**
- Real-time messaging between freelancers and clients
- Message history and searchability
- File attachments in chat (documents, images, etc.)
- Typing indicators and read receipts
- Emoji support and rich text formatting
- Message notifications and alerts
- Group chat support for project teams
- Message threads and organized conversations

---

### 7. **File Sharing & Management**
![File Sharing](./screenshots/07-file-sharing.png)

**What it does:**
- Secure upload and download of project files
- Version control - track file changes and versions
- File categorization and organization
- Set file access permissions (View, Download, Edit)
- Virus scanning and file validation
- File preview (images, PDFs, documents)
- Bulk upload support
- Automatic file backup and recovery

---

### 8. **Task Management & Task Board**
![Task Board](./screenshots/08-task-board.png)

**What it does:**
- Kanban-style task board (To Do, In Progress, Review, Done)
- Create, assign, and prioritize tasks
- Task descriptions, deadlines, and subtasks
- Task dependencies and critical path analysis
- Time tracking and effort estimation
- Comments and collaboration on tasks
- Task filters and search functionality
- Drag-and-drop task management

---

### 9. **Payment & Invoicing**
![Payment Management](./screenshots/09-payment-invoicing.png)

**What it does:**
- Automated invoice generation based on milestones
- Multiple payment methods (Credit Card, Bank Transfer, PayPal)
- Payment tracking and reconciliation
- Dispute resolution workflows
- Tax calculation and compliance
- Payment history and receipts
- Partial payment support
- Automated payment reminders

---

### 10. **Notifications & Alerts System**
![Notifications](./screenshots/10-notifications.png)

**What it does:**
- Real-time notifications for all activities
- Customizable alert preferences
- In-app notifications and email notifications
- Notification history and archive
- Priority-based notification filtering
- Unread notifications badge
- Sound alerts for urgent messages
- Daily digest summaries

---

### 11. **User Profile & Settings**
![User Profile](./screenshots/11-profile-settings.png)

**What it does:**
- Comprehensive user profile management
- Portfolio showcase for freelancers
- Skills and expertise management
- Availability and rate settings
- Privacy and security settings
- Two-factor authentication (2FA)
- Session management
- Account deactivation options

---

### 12. **Reports & Analytics Dashboard**
![Analytics](./screenshots/12-analytics-reports.png)

**What it does:**
- Project performance metrics and KPIs
- Revenue and expense analytics
- Time tracking reports
- Client satisfaction metrics
- Team productivity insights
- Financial forecasting
- Custom report generation
- Data export (CSV, PDF, Excel)

---

## 🛠️ Tech Stack

### Frontend
* **React** (Vite) - Fast, modern UI development
* **TypeScript** - Type-safe development
* **Tailwind CSS** - Utility-first styling
* **Framer Motion** - Smooth animations and transitions
* **PeerJS / WebRTC** - Real-time video and audio communication
* **React Query** - Efficient data fetching and state management
* **Axios** - HTTP client for API requests
* **Socket.io** - Real-time messaging and notifications

### Backend
* **Laravel** (PHP Framework) - Robust backend architecture
* **MySQL** - Reliable database management
* **Laravel Sanctum** - API authentication and token management
* **Laravel Queues** - Asynchronous task processing
* **Pusher / Laravel Broadcasting** - Real-time event broadcasting
* **Laravel Validation** - Form and data validation
* **Eloquent ORM** - Database interaction

### Key Technologies
* **WebRTC** - Peer-to-peer communication
* **JWT** - Secure token authentication
* **RESTful API** - Clean API design
* **Docker** - Containerization (optional)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- PHP 8.0+
- MySQL 5.7+
- Composer

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

---

## 📋 Project Structure

```
Freelancer-Client-Portal/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Utility functions
│   └── public/              # Static assets
│
├── backend/                  # Laravel backend
│   ├── app/
│   │   ├── Models/          # Database models
│   │   ├── Controllers/     # API controllers
│   │   ├── Requests/        # Form requests
│   │   └── Services/        # Business logic
│   ├── routes/              # API routes
│   ├── database/
│   │   ├── migrations/      # Database migrations
│   │   └── seeders/         # Database seeders
│   └── config/              # Configuration files
│
└── screenshots/             # Project screenshots
```

---

## 🔐 Security Features

- End-to-end encryption for messages
- Secure file uploads with virus scanning
- HTTPS/SSL encryption
- CSRF protection
- SQL injection prevention
- XSS protection
- Rate limiting on APIs
- Two-factor authentication (2FA)

---

## 📞 Support & Contact

For questions or support, please reach out to:
- **Email:** medox05@example.com
- **GitHub:** [Medox05](https://github.com/Medox05)

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🎓 About

This project was developed as a *Projet de Fin d'Études* (Final Studies Project) demonstrating full-stack web development, real-time communication, and modern software architecture principles.
