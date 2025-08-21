import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-provider';
// Import Admin SDK instances directly
import { adminDb, adminInitializationError } from '@/lib/firebase/admin.server';
import type { SystemSettings } from '@/services/system-settings';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'; // Added import
import { Suspense } from 'react'; // Added Suspense for client components

export const runtime = 'nodejs';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const DEFAULT_APP_NAME = 'AISSMS Industrial Training Institute';
const DEFAULT_APP_DESCRIPTION = 'Your comprehensive college dashboard for students.';

export async function generateMetadata(): Promise<Metadata> {
  let appName = DEFAULT_APP_NAME;
  let appDescription = DEFAULT_APP_DESCRIPTION;

  console.log('[Layout:generateMetadata] Attempting to fetch settings using Admin SDK.');

  if (adminInitializationError) {
    console.warn(
      `[Layout:generateMetadata] Firebase Admin SDK had a prior initialization error: ${adminInitializationError.message}. Using default metadata.`,
      adminInitializationError.stack ? `\nStack: ${adminInitializationError.stack}` : ''
    );
  } else if (!adminDb) { // Check if adminDb itself is null/undefined
    console.warn(
      `[Layout:generateMetadata] Firebase Admin DB (adminDb) is not available. Using default metadata.`
    );
  } else {
    try {
      console.log('[Layout:generateMetadata] AdminDb (from admin.server.ts) seems available, proceeding to fetch settings.');
      // Use adminDb directly
      const settingsDocRef = adminDb.collection('systemSettings').doc('appConfiguration');
      const docSnap = await settingsDocRef.get();

      if (docSnap.exists) {
        const settings = docSnap.data() as SystemSettings;
        appName = settings.applicationName || DEFAULT_APP_NAME;
        console.log(`[Layout:generateMetadata] Fetched appName: ${appName} from Firestore (Admin SDK).`);
      } else {
        console.warn(`[Layout:generateMetadata] System settings document ('systemSettings/appConfiguration') not found in Firestore (Admin SDK). Using default app name.`);
      }
    } catch (error) {
      const err = error as Error;
      console.warn(
        `[Layout:generateMetadata] Error fetching system settings from Firestore (Admin SDK). Using default metadata. Error: ${err.message}`,
        err.stack ? `\nStack: ${err.stack}` : ''
      );
    }
  }

  appDescription = `Access your student information and services at ${appName}.`;

  return {
    title: {
        default: appName,
        template: `%s | ${appName}`
    },
    description: appDescription,
    icons: {
      icon: '/college-logo.png', // Standard favicon
      apple: '/college-logo.png', // Apple touch icon
    },
  };
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased'
        )}
      >
        {/* GA4 component should be within body but ideally high up, Suspense wraps client components if needed */}
        <Suspense fallback={null}>
            <GoogleAnalytics />
        </Suspense>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <Analytics /> {/* Vercel Analytics component */}
            <SpeedInsights /> {/* Vercel Speed Insights component */}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
