
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getSystemSettings } from '@/services/system-settings';
import type { SystemSettings } from '@/services/system-settings';
import { Skeleton } from '@/components/ui/skeleton'; // Added Skeleton import

// Schema including name, studentId, major, and parentEmail
const signUpSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
  studentId: z.string().min(1, { message: 'Student ID is required.' }),
  major: z.string().min(1, { message: 'Major is required.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  parentEmail: z.string().email({ message: "Invalid parent's email address." }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

// Helper function to set a cookie
function setCookie(name: string, value: string, days: number) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    if (typeof document !== 'undefined') { // Ensure document is available (client-side)
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }
}


export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);


  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getSystemSettings();
        setSystemSettings(settings);
      } catch (error) {
        console.error("Failed to load system settings:", error);
        toast({
          title: "Error",
          description: "Could not load application settings. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, [toast]);


  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      studentId: '',
      major: '',
      email: '',
      password: '',
      parentEmail: '',
    },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    setLoading(true);

    if (loadingSettings) {
        toast({
            title: 'Please wait',
            description: 'Loading application settings...',
            variant: 'default'
        });
        setLoading(false);
        return;
    }

    if (!systemSettings?.allowNewUserRegistration) {
        toast({
            title: 'Registration Disabled',
            description: 'New user registration is currently disabled by the administrator.',
            variant: 'destructive'
        });
        setLoading(false);
        return;
    }


    if (!auth || !db) {
        toast({
            title: 'Initialization Error',
            description: 'Firebase is not configured correctly. Please check the console and environment variables.',
            variant: 'destructive',
        });
        setLoading(false);
        return;
    }


    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name: data.name,
        studentId: data.studentId,
        major: data.major,
        email: data.email,
        parentEmail: data.parentEmail, // Save parent's email
        role: 'student'
      });

      const idToken = await user.getIdToken();
      setCookie('firebaseAuthToken', idToken, 1);


      toast({
        title: 'Sign Up Successful',
        description: 'Your account has been created.',
      });
      router.push('/');
    } catch (error: any) {
      console.error('Sign up error:', error);
       let description = 'An unexpected error occurred. Please try again.';
       if (error.code === 'auth/email-already-in-use') {
           description = 'This email address is already in use.';
       } else if (error.code === 'auth/invalid-email') {
           description = 'Please enter a valid email address.';
       } else if (error.code === 'auth/weak-password') {
           description = 'The password is too weak. Please choose a stronger password.';
       } else if (error.code === 'auth/api-key-not-valid') {
           description = 'Firebase API Key is invalid. Please check your environment configuration.';
        } else if (error.code === 'auth/network-request-failed') {
            description = 'Network error. Please check your internet connection.';
       }
      toast({
        title: 'Sign Up Failed',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingSettings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Sign Up</CardTitle>
            <CardDescription className="text-center">Loading settings...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Sign Up</CardTitle>
          <CardDescription className="text-center">Create your student account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., S12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="major"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Major</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Computer Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parentEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent&apos;s Email</FormLabel>
                    <FormControl>
                      <Input placeholder="parent@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading || loadingSettings || !systemSettings?.allowNewUserRegistration}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/signin" className="text-primary underline hover:text-primary/90">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

