import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function daysUntil(date: Date | string): number {
  const d = new Date(date);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getDaysUntilText(date: Date | string): string {
  const days = daysUntil(date);
  if (days < 0) return 'Past due';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `${days} days`;
  if (days <= 30) return `${Math.ceil(days / 7)} weeks`;
  return `${Math.ceil(days / 30)} months`;
}

export function getDeadlineColor(date: Date | string): string {
  const days = daysUntil(date);
  if (days < 0) return 'text-red-600';
  if (days <= 7) return 'text-red-500';
  if (days <= 14) return 'text-orange-500';
  if (days <= 30) return 'text-yellow-500';
  return 'text-green-500';
}

export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function generateAnonymousId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatCredits(credits: number): string {
  if (credits >= 1000000) {
    return `${(credits / 1000000).toFixed(1)}M`;
  }
  if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}K`;
  }
  return credits.toString();
}

export function getOddsColor(odds: number): string {
  if (odds >= 70) return 'text-green-600';
  if (odds >= 50) return 'text-yellow-600';
  if (odds >= 30) return 'text-orange-500';
  return 'text-red-500';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'not_started':
      return 'bg-gray-100 text-gray-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'submitted':
      return 'bg-green-100 text-green-800';
    case 'decided':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getResultColor(result: string | null): string {
  switch (result) {
    case 'accepted':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'waitlisted':
      return 'bg-yellow-100 text-yellow-800';
    case 'deferred':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export const COLLEGE_LOGOS: Record<string, string> = {
  'Harvard': '/collegeLogos/harvard.png',
  'Stanford': '/collegeLogos/stanford.png',
  'MIT': '/collegeLogos/mit.png',
  'Yale': '/collegeLogos/yale.png',
  'Princeton': '/collegeLogos/princeton.png',
  'Columbia': '/collegeLogos/columbia.png',
  'UPenn': '/collegeLogos/upenn.png',
  'Duke': '/collegeLogos/duke.png',
  'Northwestern': '/collegeLogos/northwestern.png',
  'Caltech': '/collegeLogos/caltech.png',
  'Brown': '/collegeLogos/brown.png',
  'Dartmouth': '/collegeLogos/dartmouth.png',
  'Cornell': '/collegeLogos/cornell.png',
  'Rice': '/collegeLogos/rice.png',
  'Vanderbilt': '/collegeLogos/vanderbilt.png',
  'UCLA': '/collegeLogos/ucla.png',
  'UC Berkeley': '/collegeLogos/berkley.png',
  'USC': '/collegeLogos/usc.png',
  'NYU': '/collegeLogos/nyu.png',
  'Georgetown': '/collegeLogos/georgetown.png',
};

export function getCollegeLogo(name: string): string | null {
  return COLLEGE_LOGOS[name] || null;
}
