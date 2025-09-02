
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Github, Linkedin, Mail } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
            <Link href="/" className="transition-colors text-muted-foreground hover:text-primary">Home</Link>
            <Link href="/about" className="transition-colors hover:text-primary">About</Link>
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
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <section className="container py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto flex max-w-4xl flex-col items-center gap-8"
          >
            {/* Profile Header */}
            <div className="flex flex-col items-center gap-4 text-center">
                <Image
                    src="https://picsum.photos/200/200"
                    alt="Chinmay Ingle"
                    width={160}
                    height={160}
                    className="rounded-full object-cover shadow-lg"
                    data-ai-hint="professional headshot"
                />
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Chinmay Ingle</h1>
                <p className="text-xl text-muted-foreground">Full Stack Developer & AI Enthusiast</p>
                <div className="flex gap-4 mt-2">
                    <Button asChild variant="outline" size="icon">
                        <a href="https://github.com/ChinmayIngle" target="_blank" rel="noopener noreferrer" aria-label="GitHub Profile">
                            <Github className="h-5 w-5" />
                        </a>
                    </Button>
                    <Button asChild variant="outline" size="icon">
                        <a href="https://www.linkedin.com/in/chinmay-ingle-268598212/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn Profile">
                            <Linkedin className="h-5 w-5" />
                        </a>
                    </Button>
                    <Button asChild variant="outline" size="icon">
                        <a href="mailto:chinmayingle26@gmail.com" aria-label="Send Email">
                            <Mail className="h-5 w-5" />
                        </a>
                    </Button>
                </div>
            </div>

            {/* About Me Section */}
            <div className="w-full text-left p-6 md:p-8 border rounded-lg bg-card">
                 <h2 className="text-2xl font-bold mb-4">About Me</h2>
                 <p className="text-muted-foreground leading-relaxed">
                    Hello! I'm Chinmay, a passionate software developer with a strong foundation in web technologies and a keen interest in building intelligent, user-centric applications. This Advanced Student ERP project is a demonstration of my skills in creating complex, full-stack solutions using modern tools like Next.js, Firebase, and Google's Generative AI.
                 </p>
                 <p className="text-muted-foreground leading-relaxed mt-4">
                    My goal is to leverage technology to solve real-world problems, creating systems that are not only functional but also efficient and enjoyable to use. I thrive on challenges and am constantly exploring new technologies to expand my skill set.
                 </p>
            </div>
            
             {/* Project Info Section */}
            <div className="w-full text-left p-6 md:p-8 border rounded-lg bg-card">
                 <h2 className="text-2xl font-bold mb-4">About This Project</h2>
                 <p className="text-muted-foreground leading-relaxed">
                   This application was built from the ground up as a portfolio project to showcase a modern, scalable architecture for an educational institution. It features role-based access control (Student, Faculty, Admin), real-time data synchronization with Firestore, and integrated AI capabilities for features like grade analysis.
                 </p>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                   The primary technologies used are:
                 </p>
                 <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                    <li>**Frontend:** Next.js, React, TypeScript, Tailwind CSS, ShadCN/UI</li>
                    <li>**Backend & Database:** Firebase (Firestore, Authentication), Next.js Server Actions</li>
                    <li>**Generative AI:** Google Genkit with the Gemini model family</li>
                 </ul>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                &copy; {new Date().getFullYear()} Chinmay Ingle. All Rights Reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Link href="#" className="hover:text-primary">Privacy Policy</Link>
                <Link href="#" className="hover:text-primary">Terms of Service</Link>
            </div>
        </div>
      </footer>
    </div>
  );
}
