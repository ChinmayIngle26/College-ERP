
# Developer's Guide: Advanced Student ERP

This document provides a technical overview of the Advanced Student ERP application, built with Next.js, Firebase, and Genkit. It is intended for developers who want to understand, maintain, or extend the application's functionality.

## 1. Core Technology Stack

The application is built on a modern, robust, and scalable technology stack:

-   **Framework**: **Next.js 15+** with the App Router. This enables a hybrid of Server-Side Rendering (SSR) and Client-Side Rendering (CSR) for optimal performance and SEO.
-   **Language**: **TypeScript**. For type safety, improved developer experience, and more maintainable code.
-   **Backend & Database**: **Google Firebase**.
    -   **Firestore**: A NoSQL, document-based database for storing all application data (user profiles, classrooms, grades, etc.).
    -   **Firebase Authentication**: Manages user sign-up, sign-in, and session management.
    -   **Firebase Admin SDK**: Used in server-side logic (Server Actions, API Routes) for privileged operations like creating custom tokens or managing users.
-   **Styling**:
    -   **Tailwind CSS**: A utility-first CSS framework for rapid and consistent styling.
    -   **ShadCN/UI**: A collection of beautifully designed, accessible, and reusable React components built on top of Radix UI and Tailwind CSS.
-   **Generative AI**: **Google Genkit**.
    -   Used for AI-powered features, such as the grade analysis on the student dashboard and attendance analysis for faculty.
    -   Flows are defined in `src/ai/flows/` and are run on the Node.js server runtime.
-   **State Management**: A combination of React's built-in state (`useState`, `useEffect`) and context (`useContext`) for global state like authentication (`AuthContext`).
-   **Form Handling**: **React Hook Form** with **Zod** for validation, providing a performant and type-safe way to manage forms.
-   **Deployment**: Optimized for **Vercel**, leveraging serverless functions for backend logic.

---

## 2. Project Structure Overview

The project follows a standard Next.js App Router structure with some key directories:

```
/
├── public/                 # Static assets (images, logos)
├── src/
│   ├── app/                # Main application routes (App Router)
│   │   ├── (app)/          # Authenticated user routes (student, faculty, admin)
│   │   │   ├── dashboard/
│   │   │   ├── faculty/
│   │   │   ├── admin/
│   │   │   └── ... (other routes)
│   │   ├── (auth)/         # Routes for signin/signup (placeholder, pages are at root)
│   │   ├── api/genkit/     # API route for Genkit AI flows
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Landing page
│   ├── ai/                 # Genkit AI configuration and flows
│   │   ├── flows/
│   │   │   ├── analyze-attendance-flow.ts
│   │   │   └── ...
│   │   └── ai-instance.ts
│   ├── components/         # Reusable UI components
│   │   ├── dashboard/
│   │   ├── layout/
│   │   └── ui/             # ShadCN/UI components
│   ├── context/            # React Context providers (Auth, Theme)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and library configurations
│   │   ├── firebase/       # Firebase client and admin initializers
│   │   └── utils.ts
│   ├── services/           # Backend logic (Server Actions)
│   └── types/              # TypeScript type definitions
├── firebase.json           # Firebase CLI config for rules/indexes
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Firestore composite indexes
├── next.config.ts          # Next.js configuration
└── ...
```

---

## 3. Application Architecture

This application employs a modern Jamstack-inspired architecture centered around Next.js and Firebase. It strategically separates client-side and server-side responsibilities for security, performance, and scalability.

![Application Architecture Diagram](https://storage.googleapis.com/aissms-erp-doc-assets/AISSMS-ITI-ERP-Architecture-V2.png)

### 3.1 Frontend (Client-Side)

-   **Framework**: The **Next.js App Router** is the foundation. Pages and layouts are primarily **React Server Components (RSCs)**, which run on the server to generate HTML. This provides fast initial page loads.
-   **Interactivity**: Any component requiring user interaction (e.g., forms, buttons, state changes) is a **Client Component** (marked with `'use client';`).
-   **Data Fetching & State**:
    -   **Firebase Client SDK** (`src/lib/firebase/client.ts`): Client Components use this SDK for two main purposes:
        1.  **Authentication**: Handling user sign-in, sign-up, and observing auth state changes.
        2.  **Real-time Data**: Listening for real-time updates from Firestore using `onSnapshot` listeners (e.g., for the classroom chat).
    -   **React Hooks**: `useState`, `useEffect`, and `useContext` are used for managing component-level and global state (like the current user's auth status via `AuthContext`).

### 3.2 Backend (Server-Side Logic)

The backend is not a traditional monolithic server but a collection of serverless functions and server-side code executed by Next.js.

-   **Next.js Server Actions**: This is the primary mechanism for backend logic.
    -   Functions defined in `src/services/` and marked with `'use server';` are Server Actions.
    -   They can be called directly from Client Components as if they were local functions, but they execute securely on the server.
    -   This eliminates the need to create traditional API endpoints for most data mutation tasks (e.g., creating a classroom, submitting a grade).
-   **Firebase Admin SDK**:
    -   Server Actions use the **Admin SDK** (`src/lib/firebase/admin.server.ts`) to perform privileged operations.
    -   The Admin SDK bypasses Firestore security rules, making it suitable for administrative tasks like fetching a list of all users, creating records on behalf of others, or complex data joins that would be insecure on the client.
    -   Every sensitive Server Action **must verify the user's `idToken`** to ensure the request is authorized.
-   **Genkit AI Flows**:
    -   AI-powered logic is encapsulated in Genkit Flows (`src/ai/flows/`). These are also server-side TypeScript functions.
    -   They are called from Server Actions and interact with external AI models (like Google's Gemini) via the initialized Genkit instance.

### 3.3 Database (Firestore)

-   **Data Model**: Firestore is used as the NoSQL database. Key collections include `users`, `classrooms`, `grades`, `profileChangeRequests`, and `systemSettings`.
-   **Security**: **Firestore Rules** (`firestore.rules`) are the gatekeepers for all client-side data access. They are critical for security, defining who can read, write, or update specific documents based on their `role` and UID. For example, a rule might state that a user can only write to their own document in the `users` collection.
-   **Access Patterns**:
    1.  **Client-Side (Read-Only/Real-time)**: Client components can directly read data that security rules permit (e.g., a student reading their own profile, real-time chat messages).
    2.  **Server-Side (Write/Admin Read)**: All write operations and reads that require elevated privileges are funneled through Server Actions, which use the Admin SDK.

### 3.4 Authentication Flow

1.  **Sign-in/Sign-up**: The user interacts with a Client Component (e.g., `SignInPage`).
2.  **Firebase Client SDK**: The component uses the client-side Firebase SDK to handle the email/password authentication process with Firebase Auth.
3.  **Cookie Management**: Upon successful login, the client receives an `idToken` from Firebase. This token is set as an `httpOnly` cookie (`firebaseAuthToken`).
4.  **Middleware**: The Next.js middleware (`src/middleware.ts`) inspects every request. It checks for the presence of the `firebaseAuthToken` cookie to determine if a user is authenticated, redirecting them as needed (e.g., protecting a dashboard route or preventing an authenticated user from accessing the sign-in page).
5.  **Server Action Authorization**: When a client component calls a Server Action, it passes its `idToken`. The Server Action then uses the **Admin SDK's `verifyIdToken()`** method to securely validate the token before executing any privileged logic.

---

## 4. Core Features & Implementation

### 4.1. Authentication and Role-Based Access

-   **Mechanism**: Authentication is handled by **Firebase Authentication** on the client side (`src/lib/firebase/client.ts`).
-   **Session Management**: A `firebaseAuthToken` cookie is set on successful sign-in. This cookie is used by the **Middleware** (`src/middleware.ts`) to manage protected routes.
-   **Role-Based Layouts**: The root layout for authenticated users (`src/app/(app)/layout.tsx`) is crucial.
    1.  It checks the user's authentication state via `useAuth()`.
    2.  It fetches the user's document from Firestore to determine their `role` (`student`, `faculty`, or `admin`).
    3.  Based on the role, it dynamically renders the appropriate layout (`AdminLayout`, `FacultyLayout`, or the default student `Sidebar`). This ensures users only see the navigation and content they are permitted to access.
-   **Security Rules**: **Firestore Rules** (`firestore.rules`) provide server-side security, ensuring that users can only read/write data according to their role and ownership.

### 4.2. Data Services (Server Actions)

-   The `src/services/` directory contains all the backend logic, implemented as **Next.js Server Actions**.
-   These are `async` functions marked with the `'use server';` directive. They can be called directly from client components as if they were local functions.
-   **Admin SDK**: Server Actions use the **Firebase Admin SDK** (`src/lib/firebase/admin.server.ts`) to perform privileged operations that would be insecure on the client (e.g., creating a classroom, fetching all users, approving requests).
-   **Authentication in Server Actions**: Every server action that requires authentication accepts an `idToken` from the client. This token is verified using `adminAuth.verifyIdToken()` at the beginning of the function to authorize the request.

### 4.3. Faculty Tools

-   **Classroom Management**:
    -   Faculty can create classrooms (`createClassroom` service), which creates a new document in the `classrooms` collection in Firestore.
    -   Students can be added/removed from a classroom. This updates the `students` array field within the corresponding classroom document.
    -   Faculty can assign students to specific "batches" (e.g., for practicals) within a classroom.

-   **Attendance**:
    -   Faculty mark attendance on the `/faculty/attendance` page, which is classroom-centric.
    -   When attendance is submitted, the `submitLectureAttendance` server action is called. This creates or overwrites attendance for a specific lecture on a given date.
    -   Faculty can view detailed reports for a date range, which includes an automated **Defaulter List** for students below a customizable attendance threshold.
    -   The report also includes an **AI-powered analysis** (using the `analyzeAttendance` Genkit flow) that provides a summary, key observations, and actionable suggestions.

-   **Grade Management**:
    -   The grade management system is classroom-centric. Faculty first select a classroom, then a student from that classroom's roster.
    -   The `updateStudentGrade` service creates or updates a grade document. The document ID is a composite of `studentId` and `courseName` to ensure uniqueness.
    -   Faculty can input both the grade (e.g., "A", "85") and the **Max Marks** for an assessment.
    -   A **Classroom Report** tab provides a consolidated view of all grades for every student in the class, which can be downloaded as a CSV file.

### 4.4. Student Features

-   **Dashboard**: The central hub that aggregates data from multiple services (`profile`, `attendance`, `grades`). It calls the `analyzeGrades` Genkit flow and visually highlights low attendance.
-   **Profile Page**: Displays comprehensive student data fetched from their user document in Firestore. It implements a **change request system** for sensitive fields, which are sent to admins for approval.
-   **Classroom & Chat**:
    -   Students can view the classrooms they are enrolled in and see their assigned batch for each.
    -   Each classroom has a real-time **chat feature**, allowing students and faculty to communicate.
    -   Messages are stored in a subcollection (`messages`) within each classroom document and are displayed in real-time using a Firestore `onSnapshot` listener.

### 4.5. Admin Panel

-   **User Management**: Admins can view all users (sorted by roll number), create new user profiles (Firestore documents only), edit details, and delete profiles directly from the `/admin` page.
-   **System Settings**: The `/admin/settings` page allows admins to control application-wide behavior like `maintenanceMode` or `applicationName`. These settings are stored in a specific Firestore document: `systemSettings/appConfiguration`.
-   **Request Approval**: Admins review and approve/deny student profile change requests on the `/admin/requests` page. Approving a request triggers a server action that updates the student's main profile document and the status of the request document.

### 4.6. Genkit AI Integration

-   **Initialization**: The Genkit instance is configured in `src/ai/ai-instance.ts`. It checks for the `GOOGLE_GENAI_API_KEY` environment variable to enable the Google AI plugin.
-   **Flows**: AI-powered features are implemented as Genkit Flows in `src/ai/flows/`.
    -   **`analyze-grades-flow.ts`**: Takes a student's grades, sends them to the Gemini model, and receives a structured JSON object with an analysis, strengths, and areas for improvement for the student dashboard.
    -   **`analyze-attendance-flow.ts`**: Takes classroom attendance data, sends it to the Gemini model, and receives a structured analysis with a summary, key observations, and actionable suggestions for the faculty attendance report.
-   **Error Handling**: The application is designed to be resilient. If an AI flow fails (e.g., due to a missing API key), the dashboard or report will gracefully fall back to displaying only the raw data without crashing.

---

## 5. Getting Started & Setup

For detailed setup instructions, including Firebase project creation, environment variable configuration (especially the `GOOGLE_APPLICATION_CREDENTIALS_B64` for the Admin SDK), and initial admin user setup, refer to the **`README.md`** file.
