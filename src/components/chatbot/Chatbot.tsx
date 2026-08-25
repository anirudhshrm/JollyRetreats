import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Bot, Loader2, MessageCircle, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { getApiBaseUrl } from '@/lib/api-base'

type ChatMessage = {
  id: string
  role: 'bot' | 'user'
  text: string
}

type ChatbotResponse = {
  success: boolean
  reply?: string
  suggestions?: string[]
  message?: string
}

const API_BASE = getApiBaseUrl('/api')

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'bot',
    text: 'Hi, I can help with bookings, invoices, confirmation emails, tours, properties, cars, treks, and restaurants.'
  }
]

const defaultSuggestions = [
  'How do I book a tour?',
  'How can I download my invoice?',
  'Will I get a confirmation email?'
]

const createMessage = (role: ChatMessage['role'], text: string): ChatMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  text
})

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState(defaultSuggestions)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  const sendMessage = async (messageText: string) => {
    const trimmed = messageText.trim()
    if (!trimmed || loading) return

    setInput('')
    setError('')
    setMessages((current) => [...current, createMessage('user', trimmed)])
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE}/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: trimmed })
      })
      const payload = (await response.json()) as ChatbotResponse

      if (!response.ok || !payload.success || !payload.reply) {
        throw new Error(payload.message || 'Unable to get a chatbot reply.')
      }

      setMessages((current) => [...current, createMessage('bot', payload.reply || '')])
      if (payload.suggestions?.length) {
        setSuggestions(payload.suggestions.slice(0, 3))
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Chatbot is unavailable right now.')
      setMessages((current) => [
        ...current,
        createMessage('bot', 'I could not reach the assistant right now. Please try again in a moment.')
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void sendMessage(input)
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <Card className="mb-4 flex h-[520px] w-[min(calc(100vw-2.5rem),380px)] flex-col overflow-hidden border-border/80 bg-background shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Jolly Assistant</p>
                <p className="text-xs text-muted-foreground">Booking support</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setOpen(false)}
              aria-label="Close chatbot"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border p-4">
            {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition hover:border-primary hover:text-primary"
                  onClick={() => void sendMessage(suggestion)}
                  disabled={loading}
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void sendMessage(input)
                  }
                }}
                placeholder="Ask about bookings..."
                className="min-h-10 resize-none"
                maxLength={500}
                disabled={loading}
              />
              <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={loading || !input.trim()} aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      )}

      <Button
        type="button"
        className="relative h-14 w-14 rounded-full bg-primary p-0 font-serif text-base font-bold text-primary-foreground shadow-xl hover:bg-primary/90"
        size="icon"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'Close chatbot' : 'Open chatbot'}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <span>JR</span>
            <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-background text-primary shadow">
              <MessageCircle className="h-3.5 w-3.5" />
            </span>
          </>
        )}
      </Button>
    </div>
  )
}
