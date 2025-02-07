import { getChat } from '@/lib/actions/chat'

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const chat = await getChat(id)
    
    if (!chat) {
      return new Response('Chat not found', {
        status: 404
      })
    }

    return new Response(JSON.stringify(chat), {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error fetching chat:', error)
    return new Response('Error fetching chat', {
      status: 500
    })
  }
} 