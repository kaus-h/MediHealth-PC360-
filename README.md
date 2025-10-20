
# 🏥 MediHealth (PatientConnect360)
**A Full-Stack Healthcare Coordination Platform for Seamless Patient–Clinician Communication**

---

## 🚀 Overview
**MediHealth (PatientConnect360)** is a comprehensive, full-stack healthcare coordination platform that bridges the communication gap between patients and their healthcare providers. It enables **bidirectional relationship management**, secure **data-driven collaboration**, and **real-time communication** — empowering patients to take control of their care while helping clinicians manage caseloads efficiently.

Developed with **Next.js 15**, **TypeScript**, and **Supabase**, the platform implements **HIPAA-conscious data access**, **row-level security (RLS)**, and **real-time notifications**, demonstrating scalable, modern healthcare software architecture.

**🔗 Live Demo:** [https://medihealth-v1.vercel.app](https://medihealth-v1.vercel.app)

---

## 🧩 Core Features

### 🫂 Care Coordination
- **Bidirectional Invitations** — Patients can invite clinicians and vice versa
- **Automatic Relationship Creation** — Database triggers create links upon acceptance
- **Role-Based Dashboards** — Separate, context-aware views for patients and clinicians
- **Real-Time Updates** — Supabase subscriptions for notifications and invitations

### 🔒 Authentication & Security
- Email/password authentication via **Supabase Auth**
- Password reset & session management
- **Row-Level Security (RLS)** and **database views** for HIPAA-conscious data protection
- Secure cookies and HTTPS encryption

### 📋 User Experience
- **Modern UI/UX** powered by Tailwind CSS v4 and shadcn/ui
- Responsive design optimized for mobile healthcare professionals
- Accessible interactions with ARIA labels, keyboard navigation, and semantic HTML
- Real-time notifications, hover states, and animations for polished interaction

### ⚙️ Technical Architecture
- **Frontend:** Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes + Supabase (PostgreSQL + Auth + Realtime)
- **Storage:** Vercel Blob for file storage (images, documents)
- **Deployment:** Fully automated CI/CD pipeline on Vercel
- **AI Tools:** v0 by Vercel for layout generation, RLS debugging, SQL migrations, and rapid prototyping

---



**Data Flow Highlights:**

1. Users authenticate via Supabase Auth (JWT + cookies)
2. API routes fetch and mutate data through Supabase client
3. Triggers and views maintain relational consistency
4. Subscriptions enable live UI updates (notifications, invitations)
5. Vercel handles build, deploy, and serverless scaling automatically

---

## 🧠 Engineering Challenges & Solutions

| Challenge                            | Solution                                                                                                                   |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **Bidirectional Relationship Logic** | Created PostgreSQL triggers that automatically generate linked patient/clinician records upon invitation acceptance        |
| **RLS Policy Recursion**             | Implemented `accessible_patients` and `accessible_clinicians` views with SECURITY DEFINER to bypass recursive policy loops |
| **Mobile Responsiveness**            | Redesigned dashboard layout with collapsible navigation and stacked cards for small screens                                |
| **Supabase SSR Compatibility**       | Downgraded `@supabase/ssr` to v0.5.2 and adjusted imports for Next.js App Router compatibility                             |

---

## 🧰 Tech Stack

| Category            | Technologies                                                 |
| ------------------- | ------------------------------------------------------------ |
| **Frontend**        | Next.js 15, React 18, TypeScript, Tailwind CSS v4, shadcn/ui |
| **Backend**         | Next.js API Routes, Supabase (PostgreSQL + Realtime + Auth)  |
| **Authentication**  | Supabase Auth (Email/Password, RLS)                          |
| **Database**        | PostgreSQL with triggers, views, RLS policies                |
| **Storage**         | Vercel Blob                                                  |
| **Deployment**      | Vercel (CI/CD)                                               |
| **Version Control** | GitHub                                                       |

---

## 📈 Key Metrics

* 100+ modular React/TypeScript components
* 23+ SQL migration scripts with rollback support
* Sub-second page loads (Next.js + SSR optimization)
* Zero security vulnerabilities in authentication flow
* Fully responsive from **320px mobile to 4K screens**

---

## 🧪 Setup & Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/kaus-h/medihealth.git
cd medihealth
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Configure Environment Variables

Create a `.env.local` file in the root directory:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VERCEL_BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

### 4️⃣ Run Development Server

```bash
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** to view the app.

### 5️⃣ Deploy (Optional)

Push your code to GitHub — Vercel automatically builds and deploys previews for each commit.

---

## 🧩 Database Schema (Simplified)

```sql
TABLE profiles (
  id uuid PRIMARY KEY,
  email text,
  role text CHECK (role IN ('patient', 'clinician'))
);

TABLE invitations (
  id uuid PRIMARY KEY,
  sender_id uuid REFERENCES profiles(id),
  receiver_id uuid REFERENCES profiles(id),
  status text CHECK (status IN ('pending', 'accepted', 'declined'))
);

TABLE patient_clinicians (
  id uuid PRIMARY KEY,
  patient_id uuid REFERENCES profiles(id),
  clinician_id uuid REFERENCES profiles(id)
);
```

---

## 🔮 Future Roadmap

### Phase 1 – Core Feature Completion

* Direct messaging between patients and clinicians
* Appointment scheduling + calendar integration
* Medication tracking & reminders

### Phase 2 – AI & Analytics

* AI-powered symptom analysis and care recommendations
* Health metric visualization and risk prediction

### Phase 3 – Enterprise Expansion

* Multi-clinic management
* EHR integration (Epic, Cerner)
* HIPAA certification and audit logging

---

## 🧑‍💻 Author

**Kaustav Kalra**
Software Engineering @ ASU
[Portfolio](https://kaustavkalra.vercel.app) • [GitHub](https://github.com/kaus-h) • [LinkedIn](https://www.linkedin.com/in/kaustavkalra/)

---

## 🪪 License

This project is currently under private development. To open-source, use the [MIT License](https://opensource.org/licenses/MIT).

---

## 💬 Acknowledgments

* **v0 by Vercel** – for AI-assisted development and design generation
* **Supabase** – for robust authentication and real-time database features
* **Vercel** – for seamless deployment and scaling
* **Tailwind & shadcn/ui** – for rapid, accessible UI development

---

> 🩺 *MediHealth transforms fragmented healthcare into a connected, intelligent ecosystem — empowering patients and clinicians to collaborate for better outcomes.*

```

---

Would you like me to:
- 🧱 add **badges and shields** (e.g., “Built with Next.js”, “Deployed on Vercel”, “Supabase Powered”)  
- or 🧭 generate a **condensed README version** suitable for recruiters who skim GitHub repos (1-minute read format)?
```
