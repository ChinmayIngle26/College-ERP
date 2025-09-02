
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Github, Linkedin, Mail, Send } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const contactFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;


export default function ContactPage() {
    const { toast } = useToast();

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: {
            name: '',
            email: '',
            message: '',
        },
    });

    function onSubmit(data: ContactFormValues) {
        console.log(data);
        toast({
            title: "Message Sent!",
            description: "Thank you for reaching out. I will get back to you shortly.",
        });
        form.reset();
    }

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
            <Link href="/contact" className="transition-colors hover:text-primary">Contact</Link>
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
            className="mx-auto flex max-w-4xl flex-col items-center gap-12"
          >
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Get In Touch</h1>
                <p className="max-w-xl text-lg text-muted-foreground">
                    Have a question or want to work together? Feel free to reach out. I'm always open to discussing new projects and opportunities.
                </p>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Send a Message</CardTitle>
                        <CardDescription>Fill out the form below and I'll get back to you as soon as possible.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Your Name</FormLabel>
                                        <FormControl>
                                        <Input placeholder="John Doe" {...field} />
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
                                        <FormLabel>Your Email</FormLabel>
                                        <FormControl>
                                        <Input placeholder="you@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="message"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Message</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Tell me about your project or query..." className="min-h-[120px]" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full">
                                    Send Message <Send className="ml-2 h-4 w-4" />
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* Contact Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                             <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-muted-foreground" />
                                <a href="mailto:chinmayingle26@gmail.com" className="text-primary hover:underline">chinmayingle26@gmail.com</a>
                            </div>
                            <div className="flex items-center gap-3">
                                <Linkedin className="h-5 w-5 text-muted-foreground" />
                                <a href="https://www.linkedin.com/in/chinmay-ingle-268598212/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">LinkedIn Profile</a>
                            </div>
                            <div className="flex items-center gap-3">
                                <Github className="h-5 w-5 text-muted-foreground" />
                                <a href="https://github.com/ChinmayIngle" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub Profile</a>
                            </div>
                        </CardContent>
                    </Card>
                </div>
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
