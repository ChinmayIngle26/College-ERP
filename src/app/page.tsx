
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRight,
  BookOpen,
  UserCheck,
  Users,
  BarChart,
  FileLock,
  CheckSquare,
  ShieldCheck,
  Clock,
  Bell,
  GraduationCap,
  LayoutDashboard,
  CalendarDays,
  CreditCard,
  Library,
  Bus,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/layout/theme-toggle';

const featureCards = [
    {
        icon: LayoutDashboard,
        title: 'Student Dashboard',
        description: 'A central hub for your academic life, from grades to schedules.'
    },
    {
        icon: CalendarDays,
        title: 'Attendance & Timetable',
        description: 'Track your attendance and never miss a class with an integrated timetable.'
    },
    {
        icon: GraduationCap,
        title: 'Examination & Results',
        description: 'Access exam schedules, admit cards, and view your results instantly.'
    },
    {
        icon: CreditCard,
        title: 'Fees & Finance',
        description: 'Manage your fee payments and track your financial records with ease.'
    },
    {
        icon: Library,
        title: 'Library & Resources',
        description: 'Browse the library catalog and access digital learning resources.'
    },
    {
        icon: Users,
        title: 'Connect & Collaborate',
        description: 'Engage with faculty and classmates through integrated classroom directories.'
    }
];

const valuePropositions = [
    {
        icon: Clock,
        title: '24/7 Access',
        description: 'Your academic world is always available, anytime, anywhere, on any device.'
    },
    {
        icon: ShieldCheck,
        title: 'Secure & Verified Login',
        description: 'Rest assured that your data is protected with secure, role-based access.'
    },
    {
        icon: Bell,
        title: 'Real-time Communication',
        description: 'Stay informed with instant notifications and announcements from the college.'
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
    <div className="flex min-h-screen flex-col bg-background overflow-x-hidden">
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
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="/" className="transition-colors hover:text-primary">Home</Link>
            <Link href="/about" className="transition-colors text-muted-foreground hover:text-primary">About</Link>
            <Link href="/contact" className="transition-colors text-muted-foreground hover:text-primary">Contact</Link>
            <Link href="#" className="transition-colors text-muted-foreground hover:text-primary">FAQ</Link>
          </nav>
          <nav className="ml-auto flex items-center space-x-2">
            <ThemeToggle />
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
        <section className="relative">
          <div 
            aria-hidden="true" 
            className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-40 dark:opacity-20"
          >
              <div className="blur-[106px] h-56 bg-gradient-to-br from-primary to-purple-400 dark:from-blue-700"></div>
              <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300 dark:to-indigo-600"></div>
          </div>
          <div className="container relative grid items-center gap-6 pb-8 pt-10 md:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
              <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-5xl lg:text-6xl">
                Unified ERP for Smarter Campus Management
              </h1>
              <p className="max-w-[700px] text-lg text-muted-foreground">
                By the students, for the students. Streamlining every aspect of your college experience.
              </p>
              <motion.div
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   className="flex flex-wrap justify-center gap-4 mt-4"
                  >
                  <Button asChild size="lg">
                      <Link href="/signin">
                      Login to Portal <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                      <Link href="/signup">
                      Request Access
                      </Link>
                  </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="container py-16">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12"
            >
                <h2 className="text-3xl font-bold">Everything You Need, All in One Place</h2>
                <p className="text-muted-foreground mt-2">Explore the core modules of our integrated ERP system.</p>
            </motion.div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featureCards.map((feature, index) => (
                     <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                     >
                        <Card className="h-full hover:shadow-lg transition-shadow duration-300 flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                  <div className="p-2 bg-primary/10 rounded-md">
                                    <feature.icon className="h-6 w-6 text-primary"/>
                                  </div>
                                  {feature.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
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
                    <h2 className="text-3xl font-bold">Why Choose This ERP?</h2>
                    <p className="text-muted-foreground mt-2">Empowering education with data-driven efficiency and seamless access.</p>
                </motion.div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {valuePropositions.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                        >
                            <Card className="text-center p-6 h-full">
                                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                                  <item.icon className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                                <p className="text-muted-foreground">{item.description}</p>
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
                &copy; {new Date().getFullYear()} Chinmay Ingle. All Rights Reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Link href="#" className="hover:text-primary">Privacy Policy</Link>
                <Link href="#" className="hover:text-primary">Terms of Service</Link>
            </div>
        </div>
      </motion.footer>
    </div>
  );
}
