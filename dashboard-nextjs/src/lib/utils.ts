import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${remainingSeconds}s`
  }
}

export function formatTimeShort(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'MMM dd, yyyy')
}

export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'MMM dd, yyyy HH:mm')
}

export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(dateObj, { addSuffix: true })
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function getYesterdayString(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString().split('T')[0]
}

export function getWeekStartString(): string {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - dayOfWeek)
  return startOfWeek.toISOString().split('T')[0]
}

export function getMonthStartString(): string {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  return startOfMonth.toISOString().split('T')[0]
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

export function generateRoastMessage(
  totalTime: number,
  topSite: string | null,
  deviationCount: number
): string {
  const hours = totalTime / 3600
  
  const roastMessages = [
    `Your dedication to ${topSite || 'procrastination'} is truly remarkable. ${Math.round(hours)} hours of pure focus on avoiding productivity.`,
    `Congratulations! You've successfully transformed ${Math.round(hours)} hours into a masterclass in digital wandering.`,
    `The Lumon Corporation would be proud of your ${deviationCount} distinct deviations from productive work today.`,
    `Your browser history reads like a choose-your-own-adventure book titled "How to Avoid Responsibility."`,
    `Today's productivity score: ${Math.max(0, 100 - hours * 10)}%. The remaining percentage was invested in character development.`,
    `You've visited ${deviationCount} different sites today. That's what we call "diversified procrastination portfolio."`,
    `Your time management skills are so advanced, you've managed to make ${Math.round(hours)} hours disappear without a trace.`,
    `Breaking news: Local person discovers new way to make time move faster by staring at ${topSite || 'screens'}.`,
  ]
  
  if (hours < 0.5) {
    return "Impressive restraint today. The Wellness Department notes your exemplary digital discipline."
  }
  
  return roastMessages[Math.floor(Math.random() * roastMessages.length)]
}

export function calculateWellnessScore(
  totalTime: number,
  categoryBreakdown: Record<string, number>
): {
  productivityScore: number
  focusScore: number
  deviationScore: number
} {
  const totalHours = totalTime / 3600
  
  // Productivity score (inverse of total time spent)
  const productivityScore = Math.max(0, Math.min(100, 100 - (totalHours / 4) * 100))
  
  // Focus score based on category distribution
  const socialTime = categoryBreakdown.social || 0
  const focusScore = Math.max(0, Math.min(100, 100 - (socialTime / (totalTime || 1)) * 100))
  
  // Deviation score based on number of different categories
  const categoryCount = Object.keys(categoryBreakdown).length
  const deviationScore = Math.min(100, (categoryCount / 5) * 100)
  
  return {
    productivityScore: Math.round(productivityScore),
    focusScore: Math.round(focusScore),
    deviationScore: Math.round(deviationScore)
  }
}

export function generateRecommendations(
  productivityScore: number,
  focusScore: number,
  deviationScore: number,
  topSite: string | null
): string[] {
  const recommendations: string[] = []
  
  if (productivityScore < 50) {
    recommendations.push(
      'Consider implementing the <span class="font-medium">Social Media Severance Protocol</span> to reduce time spent on unproductive sites.'
    )
  }
  
  if (focusScore < 60) {
    recommendations.push(
      'Schedule a <span class="font-medium">Music Dance Experience</span> after completing 4 hours of focused work.'
    )
  }
  
  if (deviationScore > 70) {
    recommendations.push(
      'Your <span class="font-medium">Deviation Index</span> is high. Consider limiting the number of different sites visited.'
    )
  }
  
  if (topSite) {
    recommendations.push(
      `Your primary deviation is <span class="font-medium">${topSite}</span>. Consider implementing a specific time allocation for this site.`
    )
  }
  
  recommendations.push(
    'Your <span class="font-medium">Quarterly Review</span> is approaching. Improvement in metrics is recommended.'
  )
  
  return recommendations
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    social: '#E63946',
    entertainment: '#F77F00',
    shopping: '#FCBF49',
    news: '#EAE2B7',
    sports: '#4A9D7C',
    work: '#1A535C',
    education: '#607D8B',
    other: '#9E9E9E'
  }
  
  return colors[category] || colors.other
}

export function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url
  }
}

export function categorizeWebsite(domain: string): string {
  const categories: Record<string, string[]> = {
    social: [
      'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com',
      'tiktok.com', 'pinterest.com', 'snapchat.com', 'discord.com',
      'reddit.com', 'tumblr.com'
    ],
    entertainment: [
      'youtube.com', 'netflix.com', 'hulu.com', 'disneyplus.com',
      'twitch.tv', 'vimeo.com', 'spotify.com', 'soundcloud.com',
      'buzzfeed.com', 'imgur.com'
    ],
    shopping: [
      'amazon.com', 'ebay.com', 'etsy.com', 'walmart.com',
      'target.com', 'bestbuy.com', 'alibaba.com'
    ],
    news: [
      'cnn.com', 'bbc.com', 'nytimes.com', 'washingtonpost.com',
      'reuters.com', 'ap.org', 'npr.org'
    ],
    sports: [
      'espn.com', 'nfl.com', 'nba.com', 'mlb.com',
      'fifa.com', 'olympics.com'
    ]
  }
  
  for (const [category, domains] of Object.entries(categories)) {
    if (domains.some(d => domain.includes(d))) {
      return category
    }
  }
  
  return 'other'
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}
