
'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendMessage } from '@/services/chatService';
import { auth as clientAuth, db as clientDb } from '@/lib/firebase/client'; // For client-side Firestore access
import { collection, query, orderBy, onSnapshot, Timestamp as ClientTimestamp } from 'firebase/firestore';
import type { ChatMessage } from '@/types/chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNowStrict } from 'date-fns';

interface ChatRoomProps {
  classroomId: string;
  currentUserId: string;
  currentUserName: string;
}

export function ChatRoom({ classroomId, currentUserId, currentUserName }: ChatRoomProps) {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!clientDb || !classroomId) {
      setIsLoadingMessages(false);
      return;
    }

    setIsLoadingMessages(true);
    const messagesColRef = collection(clientDb, 'classrooms', classroomId, 'messages');
    const q = query(messagesColRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedMessages: ChatMessage[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Ensure timestamp is a Date object
          let messageTimestamp: Date;
          if (data.timestamp instanceof ClientTimestamp) {
            messageTimestamp = data.timestamp.toDate();
          } else if (data.timestamp && typeof data.timestamp.toDate === 'function') { // For server-side FieldValue
             messageTimestamp = data.timestamp.toDate();
          } else if (typeof data.timestamp === 'string') {
             messageTimestamp = new Date(data.timestamp);
          } else {
             messageTimestamp = new Date(); // Fallback, though unlikely
          }

          fetchedMessages.push({
            id: doc.id,
            ...data,
            timestamp: messageTimestamp,
          } as ChatMessage);
        });
        setMessages(fetchedMessages);
        setIsLoadingMessages(false);
      },
      (error) => {
        console.error('Error fetching messages:', error);
        toast({
          title: 'Error',
          description: 'Could not load messages. Please try again.',
          variant: 'destructive',
        });
        setIsLoadingMessages(false);
      }
    );

    return () => unsubscribe();
  }, [classroomId, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !clientAuth.currentUser) {
      toast({ title: 'Cannot send empty message or not authenticated.', variant: 'destructive' });
      return;
    }
    setIsSending(true);
    try {
      const idToken = await clientAuth.currentUser.getIdToken();
      await sendMessage(idToken, classroomId, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error Sending Message',
        description: (error as Error).message || 'Could not send your message.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="border-b p-3">
        <h3 className="font-semibold text-lg flex items-center">
            <MessageCircle className="mr-2 h-5 w-5 text-primary" />
            Classroom Chat
        </h3>
      </div>
      <ScrollArea className="flex-grow p-4">
        {isLoadingMessages && (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading messages...</p>
          </div>
        )}
        {!isLoadingMessages && messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        )}
        {!isLoadingMessages && messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${
                  msg.senderId === currentUserId ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.senderId !== currentUserId && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://placehold.co/32x32.png" alt={msg.senderName} data-ai-hint="user avatar generic" />
                    <AvatarFallback>{getInitials(msg.senderName)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    msg.senderId === currentUserId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm font-medium">{msg.senderName}</p>
                  <p className="text-sm break-words">{msg.text}</p>
                  <p className="mt-1 text-xs opacity-70">
                    {msg.timestamp instanceof Date ? formatDistanceToNowStrict(msg.timestamp, { addSuffix: true }) : 'sending...'}
                  </p>
                </div>
                {msg.senderId === currentUserId && (
                   <Avatar className="h-8 w-8">
                    <AvatarImage src="https://placehold.co/32x32.png" alt={currentUserName} data-ai-hint="user avatar current profile" />
                    <AvatarFallback>{getInitials(currentUserName)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      <div className="border-t p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow"
            disabled={isSending || isLoadingMessages}
          />
          <Button type="submit" disabled={isSending || isLoadingMessages || !newMessage.trim()}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

