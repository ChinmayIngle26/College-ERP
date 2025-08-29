
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpen, UserCheck, CheckSquare, BarChart, FileLock, Users } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

const featureCards = [
    {
        icon: BookOpen,
        title: 'Effortless Academics',
        description: 'Access grades, attendance, and schedules all in one place. Stay on top of your coursework with ease.'
    },
    {
        icon: UserCheck,
        title: 'Centralized Profile',
        description: 'Manage your personal, academic, and contact information through a single, secure student profile.'
    },
    {
        icon: Users,
        title: 'Stay Connected',
        description: 'Connect with classmates and faculty through integrated chat and classroom directories.'
    }
];

const insightItems = [
    {
        icon: BarChart,
        value: '95%',
        label: 'Attendance Accuracy'
    },
    {
        icon: FileLock,
        value: '24/7',
        label: 'Secure Record Access'
    },
    {
        icon: CheckSquare,
        value: '50%',
        label: 'Less Paperwork'
    }
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is logged in, redirect them to the dashboard
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // While checking auth state, we can show a minimal loading or blank page
  if (loading || user) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-muted/50 to-background overflow-x-hidden">
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex items-center">
            <Image
                src="/college-logo.png"
                alt="College Logo"
                width={32}
                height={32}
                className="mr-2"
                data-ai-hint="college crest logo"
            />
            <span className="font-bold">AISSMS ITI</span>
          </div>
          <nav className="ml-auto flex items-center space-x-2">
            <Button asChild variant="ghost">
                <Link href="/signin">Sign In</Link>
            </Button>
            <Button asChild>
                <Link href="/signup">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </motion.header>

      <main className="flex-1">
        <section className="container grid items-center gap-6 pb-8 pt-10 md:py-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-5xl lg:text-6xl">
              A Unified Platform for Modern Education
            </h1>
            <p className="max-w-[700px] text-lg text-muted-foreground">
              By the students, for the students.
            </p>
            <motion.div 
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                >
                <Button asChild size="lg">
                    <Link href="/signup">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </motion.div>
          </motion.div>
        </section>

        <section className="container py-12">
            <div className="grid gap-8 md:grid-cols-3">
                {featureCards.map((feature, index) => (
                     <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.2 }}
                     >
                        <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><feature.icon className="text-primary"/> {feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </section>

        <section className="bg-muted/60 py-20">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl font-bold">Key Insights at a Glance</h2>
                    <p className="text-muted-foreground mt-2">Empowering education with data-driven efficiency.</p>
                </motion.div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {insightItems.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                        >
                            <Card className="text-center p-6">
                                <item.icon className="mx-auto h-12 w-12 text-primary mb-4" />
                                <p className="text-4xl font-bold text-foreground">{item.value}</p>
                                <p className="text-muted-foreground mt-1">{item.label}</p>
                            </Card>
                        </motion.div>
                    ))}
                 </div>
            </div>
        </section>
      </main>

      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="border-t py-6 md:py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                &copy; {new Date().getFullYear()} AISSMS Industrial Training Institute. All Rights Reserved.
            </p>
        </div>
      </motion.footer>
    </div>
  );
}
