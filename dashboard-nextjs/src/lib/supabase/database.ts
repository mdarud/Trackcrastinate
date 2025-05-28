import { createClient } from './client'
import { 
  TimeEntry, 
  DailySummary, 
  UserSettings, 
  TopSite, 
  CategoryData,
  ApiResponse 
} from '@/types'
import { 
  getTodayString, 
  categorizeWebsite, 
  getCategoryColor,
  calculatePercentage 
} from '@/lib/utils'

export async function getDailySummary(
  userId: string, 
  day: string = getTodayString()
): Promise<ApiResponse<DailySummary>> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('day', day)
      .single()

    if (error && error.code !== 'PGRST116') {
      return { data: null, error: error.message, success: false }
    }

    // If no summary exists, create one from time entries
    if (!data) {
      const timeEntries = await getTimeEntries(userId, day)
      if (!timeEntries.success || !timeEntries.data) {
        return { data: null, error: 'Failed to fetch time entries', success: false }
      }

      const summary = await createDailySummary(userId, day, timeEntries.data)
      return summary
    }

    return { data, error: null, success: true }
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    }
  }
}

export async function getTimeEntries(
  userId: string, 
  day: string = getTodayString()
): Promise<ApiResponse<TimeEntry[]>> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('day', day)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null, error: error.message, success: false }
    }

    return { data: data || [], error: null, success: true }
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    }
  }
}

export async function createDailySummary(
  userId: string,
  day: string,
  timeEntries: TimeEntry[]
): Promise<ApiResponse<DailySummary>> {
  try {
    const supabase = createClient()

    // Calculate totals
    const totalTime = timeEntries.reduce((sum, entry) => sum + entry.duration, 0)
    
    // Calculate site breakdown
    const siteBreakdown: Record<string, number> = {}
    const categoryBreakdown: Record<string, number> = {}

    timeEntries.forEach(entry => {
      siteBreakdown[entry.domain] = (siteBreakdown[entry.domain] || 0) + entry.duration
      categoryBreakdown[entry.category] = (categoryBreakdown[entry.category] || 0) + entry.duration
    })

    const summaryData = {
      user_id: userId,
      day,
      total_time: totalTime,
      site_breakdown: siteBreakdown,
      category_breakdown: categoryBreakdown
    }

    const { data, error } = await supabase
      .from('daily_summaries')
      .upsert(summaryData)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message, success: false }
    }

    return { data, error: null, success: true }
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    }
  }
}

export async function getTopSites(
  userId: string, 
  day: string = getTodayString(),
  limit: number = 5
): Promise<ApiResponse<TopSite[]>> {
  try {
    const summaryResult = await getDailySummary(userId, day)
    
    if (!summaryResult.success || !summaryResult.data) {
      return { data: [], error: null, success: true }
    }

    const { site_breakdown, total_time } = summaryResult.data
    
    const topSites: TopSite[] = Object.entries(site_breakdown)
      .map(([domain, totalTime]) => ({
        domain,
        totalTime,
        category: categorizeWebsite(domain),
        percentage: calculatePercentage(totalTime, total_time)
      }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, limit)

    return { data: topSites, error: null, success: true }
  } catch (error) {
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    }
  }
}

export async function getCategoryBreakdown(
  userId: string, 
  day: string = getTodayString()
): Promise<ApiResponse<CategoryData[]>> {
  try {
    const summaryResult = await getDailySummary(userId, day)
    
    if (!summaryResult.success || !summaryResult.data) {
      return { data: [], error: null, success: true }
    }

    const { category_breakdown, total_time } = summaryResult.data
    
    const categories: CategoryData[] = Object.entries(category_breakdown)
      .map(([category, totalTime]) => ({
        category,
        totalTime,
        percentage: calculatePercentage(totalTime, total_time),
        color: getCategoryColor(category)
      }))
      .sort((a, b) => b.totalTime - a.totalTime)

    return { data: categories, error: null, success: true }
  } catch (error) {
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    }
  }
}

export async function saveTimeEntry(
  userId: string,
  domain: string,
  duration: number,
  day: string = getTodayString()
): Promise<ApiResponse<TimeEntry>> {
  try {
    const supabase = createClient()
    
    const timeEntry = {
      user_id: userId,
      domain,
      duration,
      category: categorizeWebsite(domain),
      day
    }

    const { data, error } = await supabase
      .from('time_entries')
      .insert(timeEntry)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message, success: false }
    }

    // Update daily summary
    await updateDailySummary(userId, day)

    return { data, error: null, success: true }
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    }
  }
}

export async function updateDailySummary(
  userId: string,
  day: string
): Promise<ApiResponse<DailySummary>> {
  try {
    const timeEntriesResult = await getTimeEntries(userId, day)
    
    if (!timeEntriesResult.success || !timeEntriesResult.data) {
      return { data: null, error: 'Failed to fetch time entries', success: false }
    }

    return await createDailySummary(userId, day, timeEntriesResult.data)
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    }
  }
}

export async function getUserSettings(
  userId: string
): Promise<ApiResponse<UserSettings>> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      return { data: null, error: error.message, success: false }
    }

    // If no settings exist, create default ones
    if (!data) {
      const defaultSettings = {
        user_id: userId,
        tracked_sites: [
          'facebook.com', 'twitter.com', 'instagram.com', 'reddit.com',
          'youtube.com', 'netflix.com', 'tiktok.com', 'pinterest.com'
        ],
        time_limits: {},
        notification_settings: {
          enabled: true,
          frequency: 'medium' as const,
          sound_enabled: true,
          sound_volume: 0.7,
          thresholds: [50, 75, 90, 95, 100]
        },
        dashboard_preferences: {
          theme: 'light' as const,
          default_view: 'daily' as const,
          show_wellness_metrics: true
        }
      }

      const { data: newSettings, error: createError } = await supabase
        .from('user_settings')
        .insert(defaultSettings)
        .select()
        .single()

      if (createError) {
        return { data: null, error: createError.message, success: false }
      }

      return { data: newSettings, error: null, success: true }
    }

    return { data, error: null, success: true }
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    }
  }
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<ApiResponse<UserSettings>> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message, success: false }
    }

    return { data, error: null, success: true }
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    }
  }
}

export async function getDashboardData(
  userId: string,
  day: string = getTodayString()
) {
  try {
    const [summaryResult, topSitesResult, categoriesResult] = await Promise.all([
      getDailySummary(userId, day),
      getTopSites(userId, day, 5),
      getCategoryBreakdown(userId, day)
    ])

    const summary = summaryResult.data
    const topSites = topSitesResult.data || []
    const categories = categoriesResult.data || []

    // Calculate daily stats
    const totalTime = summary?.total_time || 0
    const siteBreakdown = summary?.site_breakdown || {}
    const sites = Object.keys(siteBreakdown)
    
    const dailyStats = {
      totalTime,
      firstDeviation: sites.length > 0 ? sites[0] : null,
      mostRecentDeviation: sites.length > 0 ? sites[sites.length - 1] : null,
      deviationCount: sites.length
    }

    return {
      data: {
        dailyStats,
        topSites,
        categoryBreakdown: categories,
        summary
      },
      error: null,
      success: true
    }
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    }
  }
}
