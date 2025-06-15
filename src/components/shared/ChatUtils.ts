
import React from 'react';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'other' | 'bot';
  timestamp: Date;
}

export function getDayOfWeekString(day: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[day];
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
}

export function getInitials(name: string | undefined | null): string {
  if (!name || typeof name !== 'string') {
    return 'U'; // Default fallback for undefined/null names
  }
  
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
}
