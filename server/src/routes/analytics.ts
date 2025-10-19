import { Router, Response } from 'express';
import { getClient } from '@umami/api-client';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Umami API configuration
const UMAMI_API_URL = process.env.UMAMI_API_URL || 'https://api.umami.is/v1';
const UMAMI_API_KEY = process.env.UMAMI_API_KEY!;
const UMAMI_WEBSITE_ID = process.env.UMAMI_WEBSITE_ID!;

// Initialize Umami API client with API key
const getUmamiClient = () => {
  if (!UMAMI_API_KEY) {
    throw new Error('UMAMI_API_KEY must be configured');
  }
  
  try {
    // Create client with API key
    const client = getClient({
      apiEndpoint: UMAMI_API_URL,
      apiKey: UMAMI_API_KEY
    });
    
    return client;
  } catch (error) {
    console.error('Error initializing Umami client:', error);
    throw new Error('Failed to initialize Umami API client');
  }
};

// GET /api/admin/analytics/stats - Get website statistics from Umami
router.get('/stats', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { range = '30d' } = req.query;
    
    if (!UMAMI_WEBSITE_ID) {
      return res.status(500).json({ error: 'UMAMI_WEBSITE_ID not configured' });
    }
    
    // Get client
    const umamiClient = getUmamiClient();
    
    // Calculate dates based on range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '365d':
        startDate.setDate(startDate.getDate() - 365);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }
    
    // Get website stats using Umami API client
    const statsResponse = await umamiClient.getWebsiteStats(UMAMI_WEBSITE_ID, {
      startAt: startDate.getTime(),
      endAt: endDate.getTime()
    });
    
    // Stats response logged for debugging
    
    // Get active visitors
    const activeResponse = await umamiClient.getWebsiteActive(UMAMI_WEBSITE_ID);
    
    // Active visitors response logged for debugging
    
    // Define interfaces for the Umami API response structure
    interface MetricValue {
      value: number;
      prev: number;
    }
    
    interface WebsiteStatsData {
      pageviews?: MetricValue;
      visitors?: MetricValue;
      visits?: MetricValue;
      bounces?: MetricValue;
      totaltime?: MetricValue;
      comparison?: {
        pageviews?: MetricValue;
        visitors?: MetricValue;
        visits?: MetricValue;
        bounces?: MetricValue;
        totaltime?: MetricValue;
      };
    }
    
    interface ActiveVisitorsData {
      visitors?: MetricValue | number;
    }
    
    // Extract the actual data from the response
    const data = statsResponse.data as unknown as WebsiteStatsData;
    const comparison = data?.comparison || {};
    
    // Helper function to extract value from metric object or return 0
    const getMetricValue = (metric: MetricValue | number | undefined): number => {
      if (typeof metric === 'number') return metric;
      if (metric && typeof metric === 'object' && 'value' in metric) return (metric as MetricValue).value;
      return 0;
    };
    
    // Helper function to calculate percentage change
    const calculateChange = (current: MetricValue | number | undefined, previous: MetricValue | number | undefined): number => {
      const currentValue = getMetricValue(current);
      const previousValue = getMetricValue(previous);
      
      if (!previousValue || previousValue === 0) return 0;
      return Math.round(((currentValue - previousValue) / previousValue) * 100);
    };
    
    const result = {
      pageviews: {
        value: getMetricValue(data?.pageviews),
        change: calculateChange(data?.pageviews, comparison?.pageviews)
      },
      visitors: {
        value: getMetricValue(data?.visitors),
        change: calculateChange(data?.visitors, comparison?.visitors)
      },
      visits: {
        value: getMetricValue(data?.visits),
        change: calculateChange(data?.visits, comparison?.visits)
      },
      bounces: {
        value: getMetricValue(data?.bounces),
        change: calculateChange(data?.bounces, comparison?.bounces)
      },
      totalTime: {
        value: getMetricValue(data?.totaltime),
        change: calculateChange(data?.totaltime, comparison?.totaltime)
      },
      activeVisitors: {
        value: getMetricValue((activeResponse.data as unknown as ActiveVisitorsData)?.visitors)
      }
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching Umami stats:', error);
    
    // If authentication failed, try again
    if ((error as { status?: number }).status === 401) {
      return res.status(500).json({ error: 'Authentication failed with Umami API' });
    }
    
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// GET /api/admin/analytics/metrics - Get website metrics from Umami
router.get('/metrics', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { range = '30d' } = req.query;
    
    if (!UMAMI_WEBSITE_ID) {
      return res.status(500).json({ error: 'UMAMI_WEBSITE_ID not configured' });
    }
    
    // Get client
    const umamiClient = getUmamiClient();
    
    // Calculate dates based on range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '365d':
        startDate.setDate(startDate.getDate() - 365);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }
    
    // Get events data
    const eventsResponse = await umamiClient.getWebsiteEvents(UMAMI_WEBSITE_ID, {
      startAt: startDate.getTime().toString(),
      endAt: endDate.getTime().toString()
    });
    
    // Events response logged for debugging
    
    // Transform events data to the format expected by the frontend
    let events = [];
    if (eventsResponse.ok && eventsResponse.data && !eventsResponse.data.error) {
      events = eventsResponse.data?.data?.map((event: { eventName?: string; urlPath?: string; count?: number }) => ({
        x: event.eventName || event.urlPath || 'Unknown',
        y: event.count || 1
      })) || [];
    }
    
    // Get pageviews data using the proper method
    const pageviewsResponse = await umamiClient.getWebsitePageviews(UMAMI_WEBSITE_ID, {
      startAt: startDate.getTime(),
      endAt: endDate.getTime(),
      unit: 'day',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    });
    
    // Pageviews response logged for debugging
    
    // Transform pageviews data to the format expected by the frontend
    let pageviews: { x: string; y: number }[] = [];
    if (pageviewsResponse.ok && pageviewsResponse.data && pageviewsResponse.data.pageviews) {
      pageviews = pageviewsResponse.data.pageviews.map((item: { t: string; y: number }) => ({
        x: item.t,
        y: item.y
      }));
    }
    
    res.json({
      pageviews,
      events
    });
  } catch (error) {
    console.error('Error fetching Umami metrics:', error);
    
    // If authentication failed, try again
    if ((error as { status?: number }).status === 401) {
      return res.status(500).json({ error: 'Authentication failed with Umami API' });
    }
    
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

export default router;
