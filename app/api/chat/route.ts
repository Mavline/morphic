import { createManualToolStreamResponse } from '@/lib/streaming/create-manual-tool-stream'
import { createToolCallingStreamResponse } from '@/lib/streaming/create-tool-calling-stream'
import { isProviderEnabled, isToolCallSupported } from '@/lib/utils/registry'
import { cookies } from 'next/headers'

export const maxDuration = 30

const DEFAULT_MODEL = 'openai:gpt-4o-mini'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const { messages, id: chatId, userId } = await req.json()
    const referer = req.headers.get('referer')
    const isSharePage = referer?.includes('/share/')

    if (isSharePage) {
      return new Response('Chat API is not available on share pages', {
        status: 403,
        statusText: 'Forbidden'
      })
    }

    const cookieStore = await cookies()
    const modelFromCookie = cookieStore.get('selected-model')?.value
    const searchMode = cookieStore.get('search-mode')?.value === 'true'
    const model = modelFromCookie || DEFAULT_MODEL
    const provider = model.split(':')[0]
    
    if (!isProviderEnabled(provider)) {
      return new Response(`Provider ${provider} not enabled`, {
        status: 404,
        statusText: 'Not Found'
      })
    }

    const supportsToolCalling = isToolCallSupported(model)

    const config = {
      messages,
      model,
      chatId,
      searchMode,
      userId
    }

    const response = supportsToolCalling
      ? await createToolCallingStreamResponse(config)
      : await createManualToolStreamResponse(config)

    return response
  } catch (error) {
    console.error('API route error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
