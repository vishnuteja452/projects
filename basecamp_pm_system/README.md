# Basecamp PM System

A production-ready, sleek project management dashboard built with Node.js and vanilla JavaScript. Features a premium dark glassmorphism design and provides a comprehensive suite of tools for managing projects, members, and tasks.

## Features

- **Authentication System**: Secure user registration, login, and robust password recovery flows (forgot & reset password).
- **Project Management**: Create, view, update, and securely delete projects.
- **Role-Based Access Control**: Project-specific roles (`Admin`, `Project Admin`, `Member`).
- **Member Management**: Invite users via email, update their roles inline, and remove members.
- **Task Tracking**: Full CRUD operations for tasks with descriptions, due dates, and inline status updates.
- **Sleek UI/UX**: Premium dark mode with animated micro-interactions and glassmorphic card designs.

## Tech Stack

### Backend
- **Node.js & Express 5**: Fast and scalable server logic.
- **MongoDB & Mongoose**: Flexible NoSQL database schema and querying.
- **JWT Authentication**: Secure stateless authentication mechanism.
- **Nodemailer**: Email handling and SMTP mailings.

### Frontend
- **Vanilla JavaScript**: Lightweight, fast SPA (Single Page Application) routing.
- **Vanilla CSS3**: Custom design tokens, CSS variables, and zero-dependency styles.

## Installation & Setup

1. Clone the repository and navigate to the project folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and configure the following variables:
   ```env
   PORT=8000
   MONGO_URI=your_mongodb_connection_string
   ACCESS_TOKEN_SECRET=your_access_token_secret
   ACCESS_TOKEN_EXPIRY=1d
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   REFRESH_TOKEN_EXPIRY=10d
   MAILTRAP_SMTP_HOST=your_mailtrap_host
   MAILTRAP_SMTP_PORT=your_mailtrap_port
   MAILTRAP_SMTP_USER=your_mailtrap_user
   MAILTRAP_SMTP_PASS=your_mailtrap_pass
   FORGOT_PASSWORD_REDIRECT=http://localhost:8000/#reset-password
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:8000` in your browser.
