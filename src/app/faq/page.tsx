
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


const faqItems = [
    {
        question: "How do I reset my password?",
        answer: "To reset your password, go to the Sign In page and click the 'Forgot Password?' link. You will receive an email with instructions to set a new password."
    },
    {
        question: "Where can I view my grades and attendance?",
        answer: "You can view your grades and attendance records by logging into your student dashboard and navigating to the 'Grades' and 'Attendance' sections respectively from the sidebar menu."
    },
    {
        question: "How do I update my personal information?",
        answer: "You can request changes to sensitive personal information like your name or email from the 'My Profile' page. For other details, you can use the 'Edit Profile' mode on the same page. All change requests must be approved by an administrator."
    },
    {
        question: "Is the data on this platform secure?",
        answer: "Yes, security is a top priority. The application uses Firebase Authentication for secure login and Firestore Security Rules to ensure that users can only access data they are authorized to see based on their role (student, faculty, or admin)."
    },
    {
        question: "Who can I contact for technical support?",
        answer: "For any technical issues or questions, please use the form on our 'Contact' page to get in touch with the developer."
    },
    {
        question: "Can faculty members manage multiple classrooms?",
        answer: "Yes, faculty members can create and manage multiple classrooms. They can add or remove students, take attendance, and manage grades for each of their assigned classrooms through the Faculty Dashboard."
    }
];


export default function FaqPage() {
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
            <Link href="/about" className="transition-colors text-muted-foreground hover:text-primary">About</Link>
            <Link href="/contact" className="transition-colors text-muted-foreground hover:text-primary">Contact</Link>
            <Link href="/faq" className="transition-colors hover:text-primary">FAQ</Link>
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
            className="mx-auto flex max-w-3xl flex-col items-center gap-12"
          >
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Frequently Asked Questions</h1>
                <p className="max-w-2xl text-lg text-muted-foreground">
                    Find answers to the most common questions about the Student ERP system. If you can't find your answer here, feel free to contact us.
                </p>
            </div>

            <div className="w-full">
                <Accordion type="single" collapsible className="w-full space-y-2">
                    {faqItems.map((item, index) => (
                        <AccordionItem value={`item-${index}`} key={index} className="border rounded-lg px-4 bg-card">
                            <AccordionTrigger className="text-left hover:no-underline">{item.question}</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                {item.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
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
