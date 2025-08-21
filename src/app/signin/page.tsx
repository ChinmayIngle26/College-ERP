
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/client'; // Correct import path
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';


const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type SignInFormValues = z.infer<typeof signInSchema>;

const resetPasswordSchema = z.object({
  resetEmail: z.string().email({ message: 'Please enter a valid email address.' }),
});
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;


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


export default function SignInPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
        resetEmail: '',
    },
  });

  const onSubmit = async (data: SignInFormValues) => {
    setLoading(true);

    if (!auth || !db) {
        toast({
            title: 'Initialization Error',
            description: 'Firebase Auth is not configured correctly. Please check the console and environment variables.',
            variant: 'destructive',
        });
        setLoading(false);
        return; 
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const idToken = await user.getIdToken();
      setCookie('firebaseAuthToken', idToken, 1); 

      let userRole = 'student'; // Default role
      const ADMIN_EMAIL = "admin@gmail.com";

      if (user.email === ADMIN_EMAIL) {
        userRole = 'admin';
      } else {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (userData.role === 'admin') {
            userRole = 'admin';
          } else if (userData.role === 'faculty') {
            userRole = 'faculty';
          }
          // If role is 'student' or undefined, it remains 'student'
        } else {
          // If no user document, they might be a new user who hasn't completed profile setup
          // or an issue with data sync. Default to student role.
          console.warn(`User document not found for UID: ${user.uid} during sign-in. Defaulting to student role for redirection.`);
        }
      }

      toast({
        title: 'Sign In Successful',
        description: 'Welcome back!',
      });

      if (userRole === 'admin') {
        router.push('/admin');
      } else if (userRole === 'faculty') {
        router.push('/faculty');
      } else {
        router.push('/'); 
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      let description = 'An unexpected error occurred. Please try again.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = 'Invalid email or password.';
      } else if (error.code === 'auth/invalid-email') {
        description = 'Please enter a valid email address.';
      } else if (error.code === 'auth/api-key-not-valid') {
           description = 'Firebase API Key is invalid. Please check your environment configuration.';
       } else if (error.code === 'auth/network-request-failed') {
            description = 'Network error. Please check your internet connection.';
       }
      toast({
        title: 'Sign In Failed',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetRequest = async (data: ResetPasswordFormValues) => {
    if (!auth) {
        toast({ title: 'Error', description: 'Firebase Auth not initialized.', variant: 'destructive' });
        return;
    }
    setLoading(true);
    try {
        await sendPasswordResetEmail(auth, data.resetEmail);
        toast({
            title: 'Password Reset Email Sent',
            description: `If an account exists for ${data.resetEmail}, a password reset link has been sent. Please check your inbox (and spam folder).`,
        });
        setIsResetPasswordDialogOpen(false);
        resetPasswordForm.reset();
    } catch (error: any) {
        console.error('Password reset error:', error);
        let description = 'Could not send password reset email. Please try again.';
        if (error.code === 'auth/user-not-found') {
            description = 'No user found with this email address.';
        } else if (error.code === 'auth/invalid-email') {
            description = 'The email address is not valid.';
        }
        toast({
            title: 'Password Reset Failed',
            description: description,
            variant: 'destructive',
        });
    } finally {
        setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
                            <DialogTrigger asChild>
                                <Button type="button" variant="link" size="sm" className="p-0 h-auto text-xs">
                                Forgot Password?
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                <DialogTitle>Reset Password</DialogTitle>
                                <DialogDescription>
                                    Enter your email address below to receive a password reset link.
                                </DialogDescription>
                                </DialogHeader>
                                <Form {...resetPasswordForm}>
                                <form onSubmit={resetPasswordForm.handleSubmit(handlePasswordResetRequest)} className="space-y-4 py-4">
                                    <FormField
                                        control={resetPasswordForm.control}
                                        name="resetEmail"
                                        render={({ field: resetField }) => (
                                            <FormItem>
                                                <FormLabel htmlFor="resetEmailDialog">Email Address</FormLabel>
                                                <FormControl>
                                                    <Input id="resetEmailDialog" placeholder="you@example.com" {...resetField} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <DialogClose asChild><Button type="button" variant="outline" disabled={loading}>Cancel</Button></DialogClose>
                                        <Button type="submit" disabled={loading}>
                                        {loading ? 'Sending...' : 'Send Reset Link'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? 'text' : 'password'} 
                          placeholder="••••••••" 
                          {...field} 
                        />
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={togglePasswordVisibility}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary underline hover:text-primary/90">
              Sign Up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

