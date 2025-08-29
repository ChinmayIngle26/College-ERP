
# Advanced Student ERP Dashboard (Next.js & Firebase)

This guide will walk you through setting up the Advanced Student ERP Dashboard application on your computer. This application helps manage student information and provides a dashboard for students, faculty, and administrators.

## What You'll Need (Prerequisites)

Before you start, make sure you have the following:

*   **A Computer:** Running Windows, macOS, or Linux.
*   **Internet Connection:** To download software and connect to Firebase.
*   **A Web Browser:** Such as Chrome, Firefox, Edge, or Safari.
*   **A Google Account:** You'll need this to create a Firebase project, which acts as the backend for the app.
*   **An Email Account (for sending notifications):** You'll need SMTP credentials from an email provider like Gmail (using an App Password), SendGrid, or another email service to send notifications.
*   **Patience:** Setting up software can sometimes be tricky, but follow these steps carefully, and you'll get there!

## Understanding a Few Basic Terms

*   **Firebase:** Think of Firebase as the "brain" and "memory" for our application. It's a service provided by Google that will store user accounts, data (like student profiles, settings), and help with other background tasks.
*   **Node.js & npm:** Node.js is an environment that lets the application code run on your computer. `npm` (Node Package Manager) is a tool that comes with Node.js and helps install and manage the different "parts" or "packages" the application needs to work.
*   **Terminal (or Command Prompt/PowerShell):** This is a text-based window where you can type commands to tell your computer what to do. We'll provide the exact commands you need to type.
    *   On **Windows:** It's usually called "Command Prompt" or "PowerShell".
    *   On **macOS or Linux:** It's usually called "Terminal".
*   **`.env.local` file:** A special file in your project where you store secret keys and configuration specific to your local setup (like your Firebase project details). This file is **not** shared publicly.
*   **Service Account Key:** A JSON file that gives server-side code (like our Next.js backend features) administrative access to your Firebase project. This is also kept secret.
*   **SMTP:** Simple Mail Transfer Protocol. These are the credentials (host, port, user, password) your application needs to connect to an email server to send emails.

## Initial Setup Guide

Follow these steps in order for a fresh setup.

### Step 1: Install Node.js (which includes npm)

Node.js is essential for running the application.

1.  Go to the official Node.js website: [https://nodejs.org/](https://nodejs.org/)
2.  Download the installer for the **LTS (Long Term Support)** version. It should be clearly marked on the homepage. Choose the version for your operating system (Windows, macOS).
3.  Once downloaded, run the installer. Follow the on-screen instructions, accepting the default options. This will install both Node.js and npm.
4.  **Check if it's installed:**
    *   Open your Terminal (or Command Prompt/PowerShell).
    *   Type `node -v` and press Enter. You should see a version number like `v18.x.x` or `v20.x.x`.
    *   Then, type `npm -v` and press Enter. You should see another version number.
    *   If you see version numbers for both, Node.js and npm are installed!

### Step 2: Get the Application Code

1.  If you received the application code as a **ZIP file**:
    *   Find the ZIP file on your computer.
    *   Extract its contents to a new folder. For example, you can create a folder named `StudentApp` on your Desktop and extract the files there.
2.  If you received the application code as a **folder**:
    *   Simply ensure the folder is in a convenient location on your computer, like your Desktop or Documents folder. Let's assume you've named this folder `StudentApp`.

### Step 3: Add the College Logo (Important!)

1.  You should have received a college logo image (e.g., from the project maintainer).
2.  Save this image file as `college-logo.png` inside the `public` folder within your `StudentApp` directory.
    *   The `StudentApp` folder is the main folder containing all the application code.
    *   Inside `StudentApp`, you'll find a folder named `public`.
    *   Place your `college-logo.png` file directly into this `public` folder.
    *   The final path should look something like: `StudentApp/public/college-logo.png`.

### Step 4: Open the Application Folder in Your Terminal

You need to tell your Terminal to work "inside" the application folder.

1.  Open your Terminal (or Command Prompt/PowerShell) as described in Step 1.
2.  Type `cd ` (that's `c`, `d`, then a **space**).
3.  Drag the `StudentApp` folder (or whatever you named it) from your computer's file explorer (like Windows Explorer or macOS Finder) directly into the Terminal window. This should paste the full path to the folder after `cd `.
4.  Press Enter. Your Terminal prompt should change, indicating you are now "in" that folder.

### Step 5: Install the Application's Parts (Dependencies)

The application relies on several pre-built code packages. `npm` will download and install them.

1.  Make sure your Terminal is still in the `StudentApp` folder (from Step 4).
2.  Type the following command exactly and press Enter:
    ```bash
    npm install
    ```
3.  This step might take a few minutes. Wait for it to complete.

### Step 6: Create Your Firebase Project

Firebase will be the backend for your application.

1.  Go to the Firebase website: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2.  Sign in with your Google Account.
3.  Click on "**Add project**" or "**Create a project**".
4.  **Project Name:** Give your project a name (e.g., `MyStudentAppFirebase`).
5.  **Google Analytics:** You can choose to **disable** Google Analytics for this Firebase project if you wish (toggle the switch off or choose "Not now"). Click **Continue**.
6.  Click **Create project**. Wait for Firebase to create your project.

### Step 7: Add a Web App to Your Firebase Project

Tell Firebase that a web application will be connecting to it.

1.  On your Firebase project's "Project Overview" page, look for an icon that looks like **`</>`** (Web). Click this icon.
2.  **App nickname:** Give your web app a nickname (e.g., `StudentAppWeb`).
3.  **Firebase Hosting:** **Uncheck** the box for "Also set up Firebase Hosting for this app."
4.  Click **Register app**.
5.  **Add Firebase SDK:** Firebase will show you configuration values (your `firebaseConfig`). **COPY THESE VALUES CAREFULLY!** You'll need them for the `.env.local` file.
6.  After copying, click **Continue to console**.

### Step 8: Configure API Keys in the `.env.local` File

Your local application needs to know how to connect to *your* Firebase project and other services.

1.  In your `StudentApp` folder, create a file named `.env.local`.
    *   Open a simple text editor.
    *   Copy and paste the following template into the new file:
        ```env
        # Firebase Client Configuration - REQUIRED
        # Get these from: Firebase Console > Project Settings > General > Your apps > Web app > SDK setup and configuration
        NEXT_PUBLIC_FIREBASE_API_KEY=
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
        NEXT_PUBLIC_FIREBASE_PROJECT_ID=
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
        NEXT_PUBLIC_FIREBASE_APP_ID=
        # NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID= # Optional, only if you enabled Google Analytics for Firebase

        # Google Analytics 4 (GA4) Configuration - OPTIONAL
        # Get this from your GA4 Property > Data Streams > Web Stream Details
        # NEXT_PUBLIC_GA_MEASUREMENT_ID=

        # Genkit AI Features API Key - REQUIRED for AI features
        # Get this from Google AI Studio: https://aistudio.google.com/app/apikey
        # For Vercel, also set this in Project Settings > Environment Variables.
        GOOGLE_GENAI_API_KEY=

        # Email Notification (SMTP) Credentials - REQUIRED for sending emails
        # Get these from your email provider (e.g., Gmail App Password, SendGrid, etc.)
        # For Vercel, also set these in Project Settings > Environment Variables.
        SMTP_HOST=
        SMTP_PORT=
        SMTP_USER=
        SMTP_PASS=
        SMTP_FROM_ADDRESS=

        # Firebase Admin SDK (Server-Side) - REQUIRED
        # For Vercel, set this in Project Settings > Environment Variables.
        # For local development, this is the recommended way.
        # The value should be the *entire JSON content* of your service account key, as a single line string.
        # See Step 9 for how to get this key.
        GOOGLE_APPLICATION_CREDENTIALS_JSON=
        ```
2.  **Fill in the values:**
    *   Replace the empty values after each variable with the keys and credentials you obtained.
    *   For `GOOGLE_APPLICATION_CREDENTIALS_JSON`, you will get the JSON content in the next step.
3.  Save the `.env.local` file in the root of your `StudentApp` folder.

### Step 9: Configure Server-Side Firebase Admin Access (Service Account)

For server-side features (like some advanced data operations or Genkit flows that interact with Firebase Admin), the application needs admin credentials.

1.  **Generate a Service Account Key:**
    *   In the Firebase console, go to your Project Settings (click the gear icon near "Project Overview").
    *   Go to the **Service accounts** tab.
    *   Click on **Generate new private key**. Confirm by clicking **Generate key**.
    *   A JSON file will be downloaded. **Keep this file secure; it grants admin access.** Rename it if you like (e.g., `my-student-app-service-account.json`).
2.  **Provide Credentials to the App:**
    *   Open the downloaded service account JSON file with a text editor.
    *   Copy its **entire content**.
    *   Go back to your `.env.local` file and paste the entire JSON content as the value for `GOOGLE_APPLICATION_CREDENTIALS_JSON`. It needs to be on a single line.
    *   **For Vercel Deployment:** When deploying, you must also copy this variable and its full JSON value into your Vercel project's **Environment Variables** settings.

### Step 10: Enable Email/Password Authentication in Firebase

1.  In the Firebase console, under **Build**, click **Authentication**.
2.  Click **Get started**.
3.  Select **Email/Password** from the sign-in providers.
4.  Toggle **Enable** to ON. Click **Save**.

### Step 11: Set Up Firestore Database

1.  In the Firebase console, under **Build**, click **Firestore Database**.
2.  Click **Create database**.
3.  Choose **Start in production mode**. Click **Next**.
4.  Select a Cloud Firestore location. **This cannot be changed later.** Click **Enable**.

### Step 12: Install Firebase Command Line Tools (CLI)

1.  Open your Terminal. Type:
    ```bash
    npm install -g firebase-tools
    ```
    *(On macOS/Linux, you might need `sudo npm install -g firebase-tools`. On Windows, run Command Prompt as Administrator.)*

### Step 13: Log In to Firebase with the CLI

1.  In the Terminal, type:
    ```bash
    firebase login
    ```
2.  Follow prompts to sign in with the Google Account used for your Firebase project.

### Step 14: Connect Local App to Your Firebase Project

1.  Ensure your Terminal is "inside" your `StudentApp` folder. Type:
    ```bash
    firebase use --add
    ```
2.  Use arrow keys to select your Firebase project. Press Enter.
3.  For "alias," press Enter (or type a short name like `studentapp`). This creates/updates a `.firebaserc` file.

### Step 15: Deploy Firestore Security Rules

1.  In your Terminal (still in `StudentApp` folder), type:
    ```bash
    firebase deploy --only firestore:rules
    ```
2.  Wait for "Deploy complete!"

### Step 16: (Optional) Set Up Google Analytics 4 (GA4)

1.  Go to [Google Analytics](https://analytics.google.com/).
2.  Create an Account and a new **Google Analytics 4 Property**.
    *   **Property name:** e.g., "Student ERP GA4".
    *   Set time zone and currency.
3.  **Set up a Data Stream:** Choose **Web**.
    *   **Website URL:** `http://localhost:9002` (or your local dev port).
    *   **Stream name:** e.g., "Student ERP Web Stream".
    *   Click **Create stream**.
4.  Find your **MEASUREMENT ID** (starts with "G-", e.g., `G-XXXXXXXXXX`). Copy it.
5.  Open your `.env.local` file. Find the line:
    ```env
    # NEXT_PUBLIC_GA_MEASUREMENT_ID=
    ```
    Uncomment it and paste your Measurement ID after the `=`. Save the file.
6.  Restart your app if it's running.

### Step 17: Run the Application!

1.  In your Terminal (in `StudentApp` folder), type:
    ```bash
    npm run dev
    ```
2.  Open your web browser to the "Local" address shown (e.g., `http://localhost:9002`).

### Step 18: Create Your First User (Admin)

1.  In the app, click **Sign Up**.
    *   **Full Name:** "Admin User"
    *   **Student ID:** "admin001"
    *   **Major:** "Administration"
    *   **Email:** **`admin@gmail.com`** (This is pre-set as an admin identifier)
    *   **Password:** Choose a strong password.
    *   **Parent's Email:** `parent@example.com` (dummy)
2.  Click **Sign Up**.

### Step 19: Manually Set Admin Role in Firestore

1.  Go to the Firebase console > **Authentication**. Copy the **User UID** for `admin@gmail.com`.
2.  Go to **Firestore Database**. Click the `users` collection.
3.  Find the document whose ID matches the User UID. Click it.
4.  On the right, find/add the field `role`.
    *   If `role` exists, click the pencil icon, change its value from `student` to `admin`. Click **Update**.
    *   If `role` does **not** exist: Click **+ Add field**. Field name: `role`, Type: `string`, Value: `admin`. Click **Add**.
5.  The `admin@gmail.com` user is now an admin.

### Step 20: Sign In as Admin

1.  Go back to your app. Logout if logged in.
2.  Sign in with `admin@gmail.com` and your password.
3.  You should see the Admin Dashboard or admin features.

**Congratulations! Initial setup is complete.**

## Changing the Linked Firebase Project

If you need to switch the application to a different Firebase project (e.g., from a test project to a production project), follow these steps:

1.  **Create the New Firebase Project (if not done):**
    *   Follow **Step 6** from the "Initial Setup Guide" to create your new Firebase project.
2.  **Add a Web App to the New Project:**
    *   Follow **Step 7** to add a web app configuration to your *new* Firebase project. Critically, copy the new `firebaseConfig` values.
3.  **Update Client-Side Configuration (`.env.local`):**
    *   Open your existing `.env.local` file.
    *   Carefully replace the values for `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, etc., with the new configuration values obtained from your *new* Firebase project (from step 2 above).
    *   Save the `.env.local` file.
4.  **Update Server-Side Admin Configuration (Service Account):**
    *   Go to your *new* Firebase project in the Firebase console.
    *   Follow **Step 9** ("Generate a Service Account Key") to download a new service account JSON file for this *new* project.
    *   Update your `GOOGLE_APPLICATION_CREDENTIALS_JSON` environment variable with the content of this new service account key.
        *   **For Vercel:** Update this in your Vercel project's Environment Variables settings.
        *   **For local development:** Update the `GOOGLE_APPLICATION_CREDENTIALS_JSON` in your `.env.local`.
5.  **Update Firebase CLI Association:**
    *   Open your Terminal in the `StudentApp` folder.
    *   Run: `firebase use --add`
    *   Select your *new* Firebase project from the list and give it an alias (or use `default`). This updates your `.firebaserc` file to point the Firebase CLI to the new project for this local directory.
6.  **Enable Authentication Methods in New Project:**
    *   In your *new* Firebase project's console, go to **Authentication** > **Sign-in method**.
    *   Ensure **Email/Password** (and any other providers you use) are enabled. (Similar to **Step 10**).
7.  **Set Up Firestore in New Project:**
    *   In your *new* Firebase project's console, go to **Firestore Database**.
    *   Click **Create database**, choose production mode, and select a location. (Similar to **Step 11**).
8.  **Deploy Firestore Rules to New Project:**
    *   In your Terminal (in `StudentApp` folder, now associated with the new project), run:
        ```bash
        firebase deploy --only firestore:rules
        ```
    *   If you have custom indexes, also deploy them:
        ```bash
        firebase deploy --only firestore:indexes
        ```
9.  **Recreate Admin User (if necessary):**
    *   The users from your old Firebase project will not automatically be in the new one.
    *   You will likely need to sign up the `admin@gmail.com` user again in the application (which now points to the new project) and then manually set their role to `admin` in the *new* project's Firestore database (as described in **Steps 18 & 19**).
10. **Check Other API Keys:**
    *   Update any other keys in your `.env.local` file (like `GOOGLE_GENAI_API_KEY` or `SMTP_...` credentials) if they are tied to the old project or need to be different for the new environment.
11. **Restart Your Application:**
    *   Stop your local development server (Ctrl+C) and restart it (`npm run dev`).
    *   If deployed on Vercel, you'll need to redeploy for environment variable changes to take full effect.

After these steps, your application should be connected to the new Firebase project.

## Troubleshooting Common Issues

*   **"Firebase: Error (auth/api-key-not-valid)", "auth/invalid-api-key"**:
    *   Double-check `NEXT_PUBLIC_FIREBASE_...` values in `.env.local` against your Firebase project settings.
    *   Restart the app after changing `.env.local`.
*   **"Missing or insufficient permissions" (Firestore Error)**:
    *   Ensure Firestore rules were deployed to the correct project (`firebase deploy --only firestore:rules`).
    *   For admin functions, confirm `admin@gmail.com` user has `role: "admin"` in Firestore.
*   **`npm install` fails**:
    *   Check internet connection.
    *   Ensure Node.js LTS is installed.
*   **`npm run dev` fails**:
    *   Is Terminal in the correct `StudentApp` folder?
    *   Did `npm install` complete without errors? Try deleting `node_modules` and run `npm install` again.
*   **App shows blank page or errors in browser**:
    *   Open browser developer tools (F12) > Console for error messages.
*   **Firebase CLI `login` or `deploy` issues**:
    *   Try `firebase logout` then `firebase login --reauth`.
    *   Ensure you're logged into the correct Google account owning the Firebase project.
    *   Verify project association with `firebase use`.
*   **"Blocked cross-origin request" warning in terminal:**
    * This is often a development-time warning. The `allowedDevOrigins` in `next.config.js` might need adjustment for your specific preview URL. For `http://localhost:PORT`, this shouldn't block functionality.
*   **Email Sending Fails**:
    *   Double-check your `SMTP_...` credentials in `.env.local`.
    *   If using Gmail, ensure you have set up an "App Password" and are using that, not your regular Google password.
    *   Check your email provider's dashboard for any blocked sign-in attempts.
*   **Server-Side Features Not Working (especially on Vercel):**
    *   Ensure `GOOGLE_APPLICATION_CREDENTIALS_JSON` and other server-side keys (`GOOGLE_GENAI_API_KEY`, `SMTP_...`) are correctly set as environment variables in your Vercel project settings.

## Stopping the Application

1.  Go to the Terminal window where `npm run dev` is running.
2.  Press `Ctrl+C`.
3.  Press `Y` and Enter if asked, or `Ctrl+C` again.
