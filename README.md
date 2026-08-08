# 💬 Velora Chat

A sleek, real-time web chat application featuring public & private passcode-protected rooms, rich messaging, attachment uploads, user presence, and email verification.

---

## ⚠️ Important Note on OTP Verification

> [!IMPORTANT]  
> Live email OTP delivery relies on the **Resend API** service. Because active email service configurations or API keys may be inactive or expired:
> 
> **You can use `000000` as the universal OTP bypass code** during signup and sign-in verification across both development and production environments.

---

## ✨ Features

- 🔐 **Authentication & Security**: Email/password authentication, Google OAuth sign-in, and 6-digit OTP verification.
- 🔒 **Public & Passcode-Protected Private Groups**:
  - All rooms (public and private) are discoverable and visible to users upon login.
  - Private rooms display a lock icon (`🔒`) and require entering a passcode to unlock and join.
- ⚡ **Real-Time Communication**: Built with Socket.IO for low-latency message streaming, presence tracking, and dynamic group updates.
- 📁 **Attachment Sharing**: Upload images and documents directly within chat channels.
- 🎨 **Modern Dark-Mode UI**: Built with React and tailored CSS for a smooth, premium user experience.
- 🏗️ **Modular Backend Architecture**: Clean separation into config, services, HTTP REST routes, and WebSocket event handlers.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 (Vite)
- **Styling**: Vanilla CSS (Custom design tokens & glassmorphism)
- **WebSockets**: `socket.io-client`

### Backend
- **Runtime**: Node.js & Express
- **WebSockets**: Socket.IO
- **Database**: MongoDB & Mongoose
- **File Uploads**: Multer
- **Security**: BcryptJS
- **Email Service**: Resend API

---

## 📁 Repository Structure

```
├── back-end/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & fallback setup
│   ├── services/
│   │   ├── emailService.js       # Email sending (Resend) & OTP generation
│   │   └── groupService.js       # Group queries & default room initialization
│   ├── routes/
│   │   └── apiRoutes.js          # REST API (/api/health, /api/upload)
│   ├── sockets/
│   │   ├── authHandler.js        # Socket authentication & OTP handlers
│   │   ├── groupHandler.js       # Socket group creation, search & join handlers
│   │   ├── messageHandler.js     # Socket message sending & persistence
│   │   └── index.js              # Socket manager & online presence state
│   ├── models/                   # Mongoose schemas (User, Group, Message)
│   ├── uploads/                  # Uploaded files directory
│   └── server.js                 # Express & Socket.IO server entry point
│
└── front-end/
    ├── src/
    │   ├── components/           # UI components (Auth, Sidebar, Chat, Modals)
    │   ├── hooks/                # Socket event listeners
    │   ├── socket.js             # Socket.IO client instance
    │   ├── App.jsx               # Main application component
    │   └── styles.css            # Styling & design system
    ├── index.html
    └── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **MongoDB** instance (Local MongoDB server or MongoDB Atlas URI)

---

### Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/Velora-chatapp.git
   cd Velora-chatapp
   ```

2. **Configure Backend Environment**:
   Navigate to the `back-end` directory and create a `.env` file (or copy `.env.example`):
   ```bash
   cd back-end
   cp .env.example .env
   ```
   *Sample `back-end/.env`:*
   ```env
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   MONGODB_URI=mongodb://127.0.0.1:27017/velora_chat
   RESEND_API_KEY=your_resend_key_optional
   RESEND_FROM_EMAIL=Velora Chat <onboarding@resend.dev>
   ```

3. **Install Backend Dependencies & Start Server**:
   ```bash
   npm install
   npm run dev
   ```
   *Backend API will run on `http://localhost:3001`.*

4. **Configure Frontend Environment**:
   Navigate to the `front-end` directory and create a `.env` file:
   ```bash
   cd ../front-end
   cp .env.example .env
   ```
   *Sample `front-end/.env`:*
   ```env
   VITE_API_URL=http://localhost:3001
   ```

5. **Install Frontend Dependencies & Start App**:
   ```bash
   npm install
   npm run dev
   ```
   *Frontend will run on `http://localhost:5173`.*

---

## 🔑 Demo & Verification

1. Open `http://localhost:5173` in your browser.
2. Sign up or log in with any username/email.
3. When prompted for the **6-digit verification code**, enter: **`000000`**
4. Browse available channels in the sidebar, create public or private rooms, and enter passcodes to join private spaces.

---

