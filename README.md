# 🩺 CareSync – Remote Patient Health Monitoring System

CareSync is a comprehensive **Remote Patient Monitoring (RPM)** platform built with a modern stack including **React, Supabase, and Node.js**. It addresses the critical challenge of providing continuous oversight for patients managing chronic conditions (like hypertension and diabetes) by connecting them with their healthcare providers via a real-time, alert-driven dashboard.

---

### 💡 Problem & Solution

| Feature | Problem Addressed | CareSync Solution |
| :--- | :--- | :--- |
| **Continuity** | Doctors can only monitor vitals during sporadic office visits. | **Daily Patient Logging:** Patients securely log key vitals (BP, Blood Sugar, Heart Rate) from home. |
| **Proactivity** | Critical fluctuations in vitals often go unnoticed, leading to complications. | **Real-Time Alerts:** System automatically notifies doctors of abnormal or critical readings for immediate intervention. |
| **Clarity** | Raw data is overwhelming and difficult to interpret over time. | **Trend Visualization:** Data is presented in intuitive charts and graphs on the Doctor Dashboard, making long-term health trends clear. |

---

### 🚀 Key Features

* **Secure Patient Portal:** Intuitive interface for patients to log and view their health history.
* **Real-Time Doctor Dashboard:** A centralized interface for healthcare providers to monitor their entire patient roster's status at a glance.
* **Vitals Tracking:** Dedicated logging for **Blood Pressure (BP)**, **Blood Sugar**, and **Heart Rate**.
* **Data Visualization:** Interactive charts display **longitudinal trends** to help doctors identify patterns and anomalies.
* **Authentication & Security:** Utilizes Supabase for robust user authentication and secure storage of sensitive **PHI (Protected Health Information)**.

---

### 💻 Tech Stack

CareSync is a full-stack application designed for performance, type safety, and scalability.

**Frontend & Logic:**
* **React** (with **TypeScript**) – For the dynamic, type-safe user interfaces (Patient and Doctor Portals).
* **Vite** – Fast build tool for the frontend.
* **Tailwind CSS** – Utility-first CSS framework for rapid, responsive styling.
* **Node.js & Express.js** – Used for core server-side logic and API routing.

**Backend, Database, & Auth:**
* **Supabase** – Used as the **Backend-as-a-Service (BaaS)**, providing:
    * **PostgreSQL Database** for structured, relational data storage.
    * **Authentication** system for secure sign-up/login.
    * **Realtime** capabilities for instant data updates and alerts.

---

### ⚙️ Installation & Setup

To get CareSync running on your local machine, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Sinon1310/CareSync.git](https://github.com/Sinon1310/CareSync.git)
    cd CareSync
    ```

2.  **Install dependencies** (run in the root and any nested server/client folders, as needed):
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file and add your Supabase connection details:
    ```
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
    ```
    *(Note: The exact variable names may depend on your local setup.)*

4.  **Run the application:**
    ```bash
    npm run dev 
    ```
    The application will typically be available at `http://localhost:5173`.

---

### 🌟 Developer Punchline

> **"Developed CareSync, a full-stack patient monitoring app using React, Supabase, and TypeScript to enable type-safe patient vital logging and doctor trend monitoring through real-time, alert-driven dashboards."**

### 🤝 Connect with the Developer

| Platform | Link |
| :--- | :--- |
| **GitHub** | **[Sinon1310](https://github.com/Sinon1310)** |
