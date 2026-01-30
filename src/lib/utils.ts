import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | number | Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatWhatsAppLink(phone: string, message: string) {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encodedMessage}`;
}

export function capitalizeWords(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(/(\s+)/)
    .map(part => {
      if (part.trim().length === 0) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}
