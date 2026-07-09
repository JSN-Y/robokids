# 🤖 Robokids

**An interactive sandbox and adventure game where kids can play, build, and explore!**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![pnpm](https://img.shields.io/badge/pnpm-%234a4a4a.svg?style=for-the-badge&logo=pnpm&logoColor=f69220)](#)
[![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)](#)
[![Render](https://img.shields.io/badge/Render-%46E3B7.svg?style=for-the-badge&logo=render&logoColor=white)](#)

</div>

---

## 📖 Table of Contents
- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [Author](#-author)

---

## 🎮 About the Project

**Robokids** is a full-stack multiplayer game designed to spark creativity and provide an engaging gameplay loop for kids. Players can battle bosses, earn in-game currency, and unlock exciting cosmetics. Beyond standard gameplay, Robokids features a robust **Custom Level Creator**, allowing players to design their own stages and challenge their friends. 

The project is structured as a modern monorepo, separating the core game client, the backend API, and shared libraries for maximum scalability.

---

## ✨ Key Features

### 👦 Player Experience
* **Epic Boss Battles:** Fight unique bosses to clear stages and advance through the game.
* **Level Progression:** Play through curated, built-in levels with increasing difficulty.
* **Custom Level Editor:** A drag-and-drop level builder allowing kids to construct and play their own personalized levels.
* **Dynamic Economy:** Earn coins by defeating enemies and completing stages.
* **Item Shop:** Purchase custom skins and powerful weapons using earned in-game coins.

### 🛡️ Admin Dashboard
* **User Management:** Create, delete, and manage user accounts securely.
* **Economy & Health Controls:** Instantly modify a player's coin balance or adjust their total hearts (lives) for moderation or event purposes.

---

## 📁 Project Structure

This project uses **pnpm workspaces** to manage multiple packages in a single repository.

| Directory | Description |
| :--- | :--- |
| `/api` | The backend API server handling user data, authentication, and the game economy. |
| `/lib` | Shared workspace packages (e.g., types, utility functions) used by both the API and the client. |
| `/artifacts` | Compiled assets, generated files, or game builds. |
| `/scripts` | Custom build, deployment, and automation scripts. |
| *(Client)* | The frontend game interface (managed at the root or within its own package). |

---

## 🚀 Getting Started

Follow these instructions to set up the project locally for development and testing. *(For a deeper dive, check out [`SETUP_LOCAL.md`](./SETUP_LOCAL.md)).*

### Prerequisites

Ensure you have the following installed on your local machine:
* **Node.js** (v18.x or higher recommended)
* **[pnpm](https://pnpm.io/installation)** (v8.x or higher)
* **Git**

### 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/JSN-Y/robokids.git](https://github.com/JSN-Y/robokids.git)
   cd robokids
Install all workspace dependencies:
This command reads the pnpm-workspace.yaml and installs dependencies for the API, shared libraries, and the client simultaneously.

Bash
pnpm install
⚙️ Environment Configuration
You will need to set up environment variables for both the frontend and the backend.

Backend (/api): Create a .env file inside the api directory and add your database connection string, JWT secrets, and port configurations.

Frontend: Create a .env file in the root (or client directory) containing your local API endpoint URLs (e.g., VITE_API_URL=http://localhost:3000).

🏃‍♂️ Running the Game
To ensure the game client can communicate with the backend, you need to spin up both servers.

1. Start the API Server:

Note: Always start the API first so the game client can fetch user data on load.

Bash
cd api
pnpm run dev
2. Start the Game Client:
Open a new terminal tab/window and run the development server for the game:

Bash
# Return to the root directory
cd .. 
pnpm run dev
🌍 Deployment
This monorepo is fully configured for continuous integration and deployment (CI/CD) to modern cloud providers:

Frontend / Game Client: Configured for automated deployments on Vercel (vercel.json).

Backend / API: Configured for deployment on Render (render.yaml).

🧑‍💻 Author
Yassine Abid

GitHub: @JSN-Y
