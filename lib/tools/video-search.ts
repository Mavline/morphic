import { tool } from 'ai'
import { searchSchema } from '@/lib/schema/search'

export const videoSearchTool = tool({
  description: 'Search for videos from YouTube',
  parameters: searchSchema,
  execute: async ({ query }) => {
    try {
      const response = await fetch('https://google.serper.dev/videos', {
        method: 'POST',
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: query })
      })

      if (!response.ok) {
        console.error('Video Search API error:', response.statusText)
        return { videos: [] }
      }

      return await response.json()
    } catch (error) {
      console.error('Video Search API error:', error)
      return { videos: [] }
    }
  }
})
