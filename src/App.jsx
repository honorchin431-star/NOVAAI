import { useEffect, useRef, useState } from 'react'
import {
  Plus,
  MessageSquare,
  Send,
  Sparkles,
  User,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'

const HF_MODEL = 'meta-llama/Meta-Llama-3-8B-Instruct'
const HF_API_URL = import.meta.env.DEV
  ? '/api/hf/v1/chat/completions'
  : 'https://router.huggingface.co/v1/chat/completions'

const SCROLL_BOTTOM_THRESHOLD = 80

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'user',
    content: 'Can you explain what glassmorphism is?',
  },
  {
    id: 2,
    role: 'assistant',
    content:
      'Glassmorphism is a UI design style that combines semi-transparent backgrounds with backdrop blur (`backdrop-filter: blur`). It makes interface elements look like frosted glass floating above the background — modern, layered, and commonly used in sidebars, cards, and modals.',
  },
  {
    id: 3,
    role: 'user',
    content: 'That sounds great! Can you give me a simple way to implement it?',
  },
  {
    id: 4,
    role: 'assistant',
    content:
      'Sure. The core CSS usually has three parts:\n\n1. A semi-transparent background, e.g. `rgba(255, 255, 255, 0.1)`\n2. `backdrop-filter: blur(20px)` for the frosted blur\n3. A subtle white border and soft shadow to enhance the glass feel\n\nPair it with an animated gradient background for an even better result.',
  },
]

const INITIAL_CHAT_ID = 1

function makeChatTitle(text) {
  const trimmed = text.trim()
  if (trimmed.length <= 20) return trimmed
  return `${trimmed.slice(0, 20)}...`
}

function AuroraBackground() {
  return (
    <div className="aurora-bg" aria-hidden="true">
      <div className="aurora-blob aurora-blob-1" />
      <div className="aurora-blob aurora-blob-2" />
      <div className="aurora-blob aurora-blob-3" />
      <div className="aurora-blob aurora-blob-4" />
      <div className="aurora-blob aurora-blob-5" />
    </div>
  )
}

function Sidebar({
  chatHistory,
  activeId,
  onSelect,
  onNewChat,
  collapsed,
  onToggle,
}) {
  return (
    <aside
      className={`glass relative z-10 flex h-full shrink-0 flex-col transition-all duration-300 ${
        collapsed ? 'w-0 overflow-hidden opacity-0' : 'w-72 opacity-100'
      }`}
    >
      <div className="flex items-center gap-2 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
          <Sparkles className="h-5 w-5 text-violet-300" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">
          Nova
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="ml-auto rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/15 hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto chat-scroll px-3 py-2">
        <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-white/40">
          History
        </p>
        {chatHistory.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-white/30">
            No chat history yet
          </p>
        ) : (
          <ul className="space-y-1">
            {chatHistory.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={`group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                    activeId === item.id
                      ? 'bg-white/15 text-white'
                      : 'text-white/70 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-white/40 group-hover:text-white/60" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-white/35">{item.date}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 text-xs font-bold text-white">
            U
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">User</p>
            <p className="text-xs text-white/40">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`message-animate flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500'
            : 'bg-white/10'
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Sparkles className="h-4 w-4 text-violet-300" />
        )}
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'glass-strong text-white'
            : message.error
              ? 'border border-red-400/30 bg-red-500/10 text-red-200'
              : 'bg-white/5 text-white/90'
        }`}
      >
        {message.loading ? (
          <div className="flex items-center gap-2 text-white/70">
            <span>Nova is thinking</span>
            <span className="flex items-center gap-1 pt-1">
              <span className="thinking-dot" />
              <span className="thinking-dot" />
              <span className="thinking-dot" />
            </span>
          </div>
        ) : (
          message.content.split('\n').map((line, i) => (
            <p key={i} className={i > 0 ? 'mt-2' : ''}>
              {line}
            </p>
          ))
        )}
      </div>
    </div>
  )
}

function ChatArea({
  messages,
  activeChatId,
  newChatTrigger,
  onEnsureChat,
  onUpdateMessages,
  sidebarCollapsed,
  onToggleSidebar,
}) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const nextId = useRef(1)
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const isAtBottomRef = useRef(true)

  useEffect(() => {
    const maxId = messages.reduce((max, m) => Math.max(max, m.id), 0)
    nextId.current = maxId + 1
  }, [activeChatId, messages])

  const checkIsAtBottom = () => {
    const el = containerRef.current
    if (!el) return true
    return (
      el.scrollHeight - el.scrollTop - el.clientHeight <=
      SCROLL_BOTTOM_THRESHOLD
    )
  }

  const scrollToBottom = () => {
    const el = containerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }

  const handleContainerScroll = () => {
    isAtBottomRef.current = checkIsAtBottom()
  }

  useEffect(() => {
    if (messages.length === 0) return

    const lastMessage = messages[messages.length - 1]
    const isUserMessage = lastMessage?.role === 'user'

    if (isUserMessage) {
      isAtBottomRef.current = true
    }

    if (isUserMessage || isAtBottomRef.current) {
      requestAnimationFrame(scrollToBottom)
    }
  }, [messages])

  useEffect(() => {
    setInput('')
    setIsLoading(false)
    isAtBottomRef.current = true
    const timer = setTimeout(() => inputRef.current?.focus(), 0)
    return () => clearTimeout(timer)
  }, [newChatTrigger, activeChatId])

  const fetchAiReply = async (chatId, history, loadingId) => {
    const token = import.meta.env.VITE_HF_TOKEN?.trim()
    if (!token) {
      console.error('[Nova API] VITE_HF_TOKEN is missing or empty')
      onUpdateMessages(chatId, (prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                loading: false,
                error: true,
                content: '⚠️ API token not found. Please check VITE_HF_TOKEN in your .env file.',
              }
            : m,
        ),
      )
      setIsLoading(false)
      return
    }

    const requestBody = {
      model: HF_MODEL,
      messages: history.map(({ role, content }) => ({ role, content })),
      max_tokens: 1024,
    }

    const authHeader = `Bearer ${token}`

    console.log('[Nova API] Sending request', {
      url: HF_API_URL,
      model: HF_MODEL,
      messageCount: requestBody.messages.length,
      tokenPresent: true,
      tokenPrefix: `${token.slice(0, 7)}...`,
      authFormatValid: authHeader.startsWith('Bearer hf_'),
      viaProxy: import.meta.env.DEV,
    })

    try {
      const response = await fetch(HF_API_URL, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json().catch(() => ({}))

      console.log('[Nova API] Response status', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        data,
      })

      if (!response.ok) {
        const errMsg =
          data.error?.message ||
          data.error ||
          data.message ||
          (typeof data === 'string' ? data : null) ||
          `Request failed (HTTP ${response.status})`
        throw new Error(errMsg)
      }

      const reply = data.choices?.[0]?.message?.content
      if (!reply) {
        throw new Error('API returned an empty response. Please try again later.')
      }

      onUpdateMessages(chatId, (prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { ...m, content: reply, loading: false, error: false }
            : m,
        ),
      )
    } catch (error) {
      console.error('[Nova API] Request failed:', error)
      console.error('[Nova API] Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        likelyCors:
          error?.message === 'Failed to fetch' ||
          error?.name === 'TypeError',
      })

      const isLikelyCors = error?.message === 'Failed to fetch'
      const userMessage = isLikelyCors
        ? '⚠️ Network request blocked (usually a browser CORS issue). Open the F12 console and check [Nova API] logs. A Vite proxy is configured for dev — restart the dev server and try again.'
        : `⚠️ ${error?.message || 'Request failed. Please try again later.'}`

      onUpdateMessages(chatId, (prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                loading: false,
                error: true,
                content: userMessage,
              }
            : m,
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const chatId = onEnsureChat(trimmed)

    const userMsg = {
      id: nextId.current++,
      role: 'user',
      content: trimmed,
    }
    const loadingId = nextId.current++
    const loadingMsg = {
      id: loadingId,
      role: 'assistant',
      content: '',
      loading: true,
    }

    const history = [
      ...messages.filter((m) => !m.loading && !m.error),
      userMsg,
    ]

    onUpdateMessages(chatId, (prev) => [...prev, userMsg, loadingMsg])
    setInput('')
    setIsLoading(true)
    fetchAiReply(chatId, history, loadingId)
  }

  return (
    <main className="glass relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl">
      <header className="flex items-center gap-3 border-b border-white/10 px-6 py-4">
        {sidebarCollapsed && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-300" />
          <h1 className="text-base font-semibold text-white">Nova AI</h1>
        </div>
        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/50">
          Gemini Style
        </span>
      </header>

      <div
        ref={containerRef}
        onScroll={handleContainerScroll}
        className="chat-scroll flex-1 overflow-y-auto px-6 py-6"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <Sparkles className="h-7 w-7 text-violet-300" />
              </div>
              <h2 className="text-lg font-semibold text-white">Start a new chat</h2>
              <p className="mt-2 max-w-sm text-sm text-white/45">
                What would you like to talk about? Type your message below and Nova is ready to help.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
        </div>
      </div>

      <footer className="border-t border-white/10 px-6 py-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-end gap-3"
        >
          <div className="glass-strong flex flex-1 items-center gap-2 rounded-2xl px-4 py-3 transition-all focus-within:border-white/25 focus-within:shadow-lg">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder={isLoading ? 'Nova is replying...' : 'Type your message...'}
              rows={1}
              disabled={isLoading}
              className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent text-sm text-white placeholder-white/35 outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white transition-all hover:shadow-lg hover:shadow-violet-500/25 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-white/30">
          Nova can make mistakes. Please verify important information.
        </p>
      </footer>
    </main>
  )
}

function App() {
  const nextChatId = useRef(INITIAL_CHAT_ID + 1)

  const [chatHistory, setChatHistory] = useState([
    {
      id: INITIAL_CHAT_ID,
      title: makeChatTitle(INITIAL_MESSAGES[0].content),
      date: 'Today',
      messages: INITIAL_MESSAGES,
    },
  ])
  const [activeChatId, setActiveChatId] = useState(INITIAL_CHAT_ID)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [newChatTrigger, setNewChatTrigger] = useState(0)

  const activeChat = chatHistory.find((c) => c.id === activeChatId)
  const currentMessages =
    activeChatId === null ? [] : (activeChat?.messages ?? [])

  const handleNewChat = () => {
    setActiveChatId(null)
    setNewChatTrigger((n) => n + 1)
  }

  const handleSelectChat = (id) => {
    setActiveChatId(id)
  }

  const ensureActiveChat = (firstMessage) => {
    if (activeChatId !== null) {
      const existing = chatHistory.find((c) => c.id === activeChatId)
      const hasUserMessage = existing?.messages.some((m) => m.role === 'user')
      if (hasUserMessage) return activeChatId

      const title = makeChatTitle(firstMessage)
      setChatHistory((prev) =>
        prev.map((c) =>
          c.id === activeChatId ? { ...c, title } : c,
        ),
      )
      return activeChatId
    }

    const id = nextChatId.current++
    const title = makeChatTitle(firstMessage)
    const newChat = { id, title, date: 'Today', messages: [] }

    setChatHistory((prev) => [newChat, ...prev])
    setActiveChatId(id)
    return id
  }

  const updateMessages = (chatId, updater) => {
    setChatHistory((prev) =>
      prev.map((c) => {
        if (c.id !== chatId) return c
        const newMessages =
          typeof updater === 'function' ? updater(c.messages) : updater
        return { ...c, messages: newMessages }
      }),
    )
  }

  return (
    <div className="relative flex h-full w-full">
      <AuroraBackground />

      <div className="relative z-10 flex h-full w-full gap-3 p-3">
        <Sidebar
          chatHistory={chatHistory}
          activeId={activeChatId}
          onSelect={handleSelectChat}
          onNewChat={handleNewChat}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(true)}
        />
        <ChatArea
          messages={currentMessages}
          activeChatId={activeChatId}
          newChatTrigger={newChatTrigger}
          onEnsureChat={ensureActiveChat}
          onUpdateMessages={updateMessages}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(false)}
        />
      </div>
    </div>
  )
}

export default App
