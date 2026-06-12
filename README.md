<div align="center">

# 🚀 Vishnu Teja — Full-Stack Project Portfolio

[![GitHub](https://img.shields.io/badge/GitHub-vishnuteja452-181717?style=for-the-badge&logo=github)](https://github.com/vishnuteja452)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

**A curated collection of full-stack web applications showcasing backend architecture, REST API design, authentication systems, and modern frontend development.**

---

</div>

## 📂 Projects

| # | Project | Description | Tech Stack |
|---|---------|-------------|------------|
| 1 | [**VidTube**](./vidtube) | Full-stack video hosting platform | React · Node.js · Express · MongoDB · Cloudinary · JWT |
| 2 | [**Basecamp PM System**](./basecamp_pm_system) | Project management dashboard | Node.js · Express 5 · MongoDB · JWT · Nodemailer |
| 3 | [**General Electric Elevators**](./general_electric_elevators) | Corporate enterprise portal | Node.js · Express · MongoDB · JWT · Vanilla JS |
| 4 | [**Postra**](./postra) | Threaded discussion forum | Node.js · Express · MongoDB · Passport.js · Google OAuth |

---

## 🎬 VidTube

> A feature-rich video hosting platform inspired by YouTube, with a sleek dark-mode UI and full creator studio.

<table>
<tr>
<td width="50%">

### ✨ Key Features
- 🔐 JWT-based authentication with secure HttpOnly cookies
- 📹 Real video uploading with Cloudinary integration
- 🎨 Premium dark-mode UI built with React
- 📺 Embedded YouTube player for video playback
- 📊 Creator Studio with channel analytics dashboard
- 🔔 Subscribe to channels & personalized subscription feed
- 💬 Comment system on videos
- 📜 Watch history tracking

</td>
<td width="50%">

### 🛠 Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19 · Vite · React Router |
| Backend | Node.js · Express 5 |
| Database | MongoDB · Mongoose |
| Auth | JWT · bcrypt · cookie-parser |
| Storage | Cloudinary · Multer |
| API | RESTful with aggregation pipelines |

</td>
</tr>
</table>

<details>
<summary><b>📁 Project Structure</b></summary>

```
vidtube/
├── frontend/               # React SPA
│   ├── src/
│   │   ├── pages/          # Home, Watch, Channel, Studio, Auth
│   │   ├── context/        # AuthContext (global state)
│   │   └── data/           # Video seed data
│   └── public/
├── src/                    # Express Backend
│   ├── controllers/        # User, Video, Comment, Like, Subscription, Playlist, Tweet
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API route definitions
│   ├── middlewares/        # Auth, error handling, file upload
│   └── utils/              # API helpers, Cloudinary config
└── package.json
```

</details>

---

## 📋 Basecamp PM System

> A production-ready project management dashboard with role-based access control, task tracking, and email notifications.

<table>
<tr>
<td width="50%">

### ✨ Key Features
- 🔐 Full authentication with password recovery via email
- 📁 CRUD operations for projects, tasks, and subtasks
- 👥 Role-based access control (Admin · Project Admin · Member)
- ✉️ Email invitations for team members via Nodemailer
- 📊 Inline status updates and due date tracking
- 🎨 Premium glassmorphism dark-mode design

</td>
<td width="50%">

### 🛠 Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS · CSS3 (SPA) |
| Backend | Node.js · Express 5 |
| Database | MongoDB · Mongoose 9 |
| Auth | JWT · bcrypt |
| Email | Nodemailer · Mailgen |
| Validation | express-validator |

</td>
</tr>
</table>

---

## 🏢 General Electric Elevators

> A corporate enterprise portal for an elevator company, featuring employee management, project tracking, and ticket systems.

<table>
<tr>
<td width="50%">

### ✨ Key Features
- 🔐 Secure authentication with admin-only routes
- 🎫 Ticket management system for service requests
- 📁 Project and attendance tracking
- 👥 User role management with middleware guards
- 🎨 Responsive corporate UI

</td>
<td width="50%">

### 🛠 Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS · CSS3 |
| Backend | Node.js · Express |
| Database | MongoDB · Mongoose |
| Auth | JWT · bcrypt |

</td>
</tr>
</table>

---

## 💬 Postra

> **P**articipation **O**riented **S**tructured **T**hreaded **R**esponse **A**pplication — a full-featured discussion forum with threaded conversations and social authentication.

<table>
<tr>
<td width="50%">

### ✨ Key Features
- 🔐 Dual authentication: local + Google OAuth 2.0
- 💬 Threaded conversation system with nested comments
- 🏷️ Tag-based post categorization
- 👤 Guest browsing mode
- 🤖 AI-powered content assistance via Gemini API
- 🎨 Modern, responsive forum UI

</td>
<td width="50%">

### 🛠 Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS · CSS3 |
| Backend | Node.js · Express |
| Database | MongoDB · Mongoose |
| Auth | Passport.js · Google OAuth 2.0 · JWT |
| AI | Google Gemini API |

</td>
</tr>
</table>

---

<div align="center">

## 🧰 Core Skills Demonstrated

| Skill | Details |
|-------|---------|
| **Backend Architecture** | RESTful API design, MVC pattern, middleware pipelines, error handling |
| **Authentication & Security** | JWT tokens, bcrypt hashing, OAuth 2.0, HttpOnly cookies, RBAC |
| **Database Design** | MongoDB schema design, Mongoose ODM, aggregation pipelines, pagination |
| **Frontend Development** | React 19, Vite, SPA routing, global state management, responsive design |
| **Cloud Integration** | Cloudinary media storage, Nodemailer SMTP, third-party API integration |
| **DevOps & Tooling** | Git version control, environment configuration, development workflows |

---

### 📫 Get In Touch

Built with ❤️ by **Vishnu Teja**

[![GitHub](https://img.shields.io/badge/GitHub-vishnuteja452-181717?style=flat-square&logo=github)](https://github.com/vishnuteja452)

</div>