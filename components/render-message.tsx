import { JSONValue, Message } from 'ai'
import { useMemo } from 'react'
import { AnswerSection } from './answer-section'
import { ReasoningAnswerSection } from './reasoning-answer-section'
import RelatedQuestions from './related-questions'
import { ToolSection } from './tool-section'
import { UserMessage } from './user-message'
import { ToolInvocation } from '@/lib/types'

interface RenderMessageProps {
  message: Message
  messageId: string
  getIsOpen: (id: string) => boolean
  onOpenChange: (id: string, open: boolean) => void
  onQuerySelect: (query: string) => void
  chatId?: string
}

export function RenderMessage({
  message,
  messageId,
  getIsOpen,
  onOpenChange,
  onQuerySelect,
  chatId
}: RenderMessageProps) {
  const relatedQuestions = useMemo(
    () =>
      message.annotations?.filter(
        annotation => (annotation as any)?.type === 'related-questions'
      ),
    [message.annotations]
  )

  // Обработка результатов поиска из аннотаций
  const toolData = useMemo(() => {
    const toolAnnotations =
      (message.annotations?.filter(
        annotation =>
          (annotation as unknown as { type: string }).type === 'tool_call'
      ) as unknown as Array<{
        data: {
          toolCallId: string
          state: 'call' | 'result'
          toolName: string
          args: string
          result?: string
        }
      }>) || []

    // Группируем по toolCallId и приоритизируем состояние 'result'
    const toolDataMap = toolAnnotations.reduce((acc, annotation) => {
      const existing = acc.get(annotation.data.toolCallId)
      if (!existing || annotation.data.state === 'result') {
        acc.set(annotation.data.toolCallId, {
          ...annotation.data,
          args: annotation.data.args ? JSON.parse(annotation.data.args) : {},
          result:
            annotation.data.result && annotation.data.result !== 'undefined'
              ? JSON.parse(annotation.data.result)
              : undefined,
          state: annotation.data.state
        } as ToolInvocation)
      }
      return acc
    }, new Map<string, ToolInvocation>())

    return Array.from(toolDataMap.values())
  }, [message.annotations])

  if (!message || !message.content) {
    return null
  }

  if (message.role === 'user') {
    return <UserMessage key={`user-${messageId}`} message={message.content} />
  }

  return (
    <>
      {toolData.map(tool => (
        <ToolSection
          key={`tool-${tool.toolCallId}`}
          tool={tool}
          isOpen={getIsOpen(tool.toolCallId)}
          onOpenChange={open => onOpenChange(tool.toolCallId, open)}
        />
      ))}
      {message.reasoning ? (
        <ReasoningAnswerSection
          key={`reasoning-${messageId}`}
          content={{
            reasoning: message.reasoning,
            answer: message.content
          }}
          isOpen={getIsOpen(messageId)}
          onOpenChange={open => onOpenChange(messageId, open)}
          chatId={chatId}
        />
      ) : (
        <AnswerSection
          key={`answer-${messageId}`}
          content={message.content}
          isOpen={getIsOpen(messageId)}
          onOpenChange={open => onOpenChange(messageId, open)}
          chatId={chatId}
        />
      )}
      {relatedQuestions && relatedQuestions.length > 0 && (
        <RelatedQuestions
          key={`related-${messageId}`}
          annotations={relatedQuestions as JSONValue[]}
          onQuerySelect={onQuerySelect}
          isOpen={getIsOpen(`${messageId}-related`)}
          onOpenChange={open => onOpenChange(`${messageId}-related`, open)}
        />
      )}
    </>
  )
}
