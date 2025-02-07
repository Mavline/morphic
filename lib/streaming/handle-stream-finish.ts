import { getChat, saveChat } from '@/lib/actions/chat'
import { generateRelatedQuestions } from '@/lib/agents/generate-related-questions'
import { ExtendedCoreMessage } from '@/lib/types'
import { convertToExtendedCoreMessages } from '@/lib/utils'
import { CoreMessage, DataStreamWriter, JSONValue, Message, generateId } from 'ai'

interface HandleStreamFinishParams {
  responseMessages: CoreMessage[]
  originalMessages: Message[]
  model: string
  chatId: string
  dataStream: DataStreamWriter
  userId?: string
  skipRelatedQuestions?: boolean
  annotations?: ExtendedCoreMessage[]
}

export async function handleStreamFinish({
  responseMessages,
  originalMessages,
  model,
  chatId,
  dataStream,
  userId = 'anonymous',
  skipRelatedQuestions = false,
  annotations = []
}: HandleStreamFinishParams) {
  try {
    const extendedCoreMessages = convertToExtendedCoreMessages(originalMessages)
    let allAnnotations = [...annotations]

    if (!skipRelatedQuestions) {
      const relatedQuestions = await generateRelatedQuestions(
        responseMessages,
        model
      )

      const updatedRelatedQuestionsAnnotation: ExtendedCoreMessage = {
        role: 'data',
        content: {
          type: 'related-questions',
          data: relatedQuestions.object
        } as JSONValue
      }

      dataStream.writeMessageAnnotation(
        updatedRelatedQuestionsAnnotation.content as JSONValue
      )
      allAnnotations.push(updatedRelatedQuestionsAnnotation)
    }

    const generatedMessages = [
      ...extendedCoreMessages,
      ...responseMessages.slice(0, -1),
      ...allAnnotations,
      ...responseMessages.slice(-1)
    ] as ExtendedCoreMessage[]

    const savedChat = (await getChat(chatId, userId)) ?? {
      messages: [],
      createdAt: new Date(),
      userId,
      path: `/search/${chatId}`,
      title: originalMessages[0]?.content || 'New Chat',
      id: chatId
    }

    const updatedChat = {
      ...savedChat,
      messages: generatedMessages
    }

    await saveChat(updatedChat, userId)

    // Отправляем сообщение о завершении с обновленными сообщениями
    const completeMessage = {
      type: 'complete-message',
      data: {
        messages: generatedMessages.map(msg => ({
          id: msg.id || generateId(),
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
        }))
      }
    } as const

    dataStream.writeMessageAnnotation(completeMessage)
  } catch (error) {
    console.error('Error in handleStreamFinish:', error)
    const errorMessage = {
      type: 'error',
      data: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    } as const
    dataStream.writeMessageAnnotation(errorMessage)
    throw error
  }
}
