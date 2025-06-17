import { useState, useRef, useEffect } from 'react'
import { Send, Settings, Moon, Sun, Bot, User, Upload, Download, Trash2 } from 'lucide-react'
import { sendMessage } from './api/llmProviders'
import './App.css'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '')
  const [selectedModel, setSelectedModel] = useState(localStorage.getItem('selectedModel') || 'openai-gpt-4')
  const [showSettings, setShowSettings] = useState(!apiKey)
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true')
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const models = [
    { id: 'openai-gpt-4', name: 'GPT-4 Turbo', provider: 'OpenAI' },
    { id: 'openai-gpt-3.5', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
    { id: 'anthropic-claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
    { id: 'anthropic-claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
    { id: 'anthropic-claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic' },
    { id: 'google-gemini-pro', name: 'Gemini Pro', provider: 'Google' },
    { id: 'google-gemini-pro-vision', name: 'Gemini Pro Vision', provider: 'Google' }
  ]

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    if (!apiKey) {
      alert('Por favor, configure sua API key nas configurações.')
      setShowSettings(true)
      return
    }

    const userMessage = { role: 'user', content: input, timestamp: new Date(), model: selectedModel }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await sendMessage(input, selectedModel, apiKey, messages)
      const assistantMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        model: selectedModel
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      const errorMessage = {
        role: 'assistant',
        content: `Erro: ${error.message}`,
        timestamp: new Date(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = () => {
    if (!apiKey.trim()) {
      alert('Por favor, insira uma API key válida.')
      return
    }
    localStorage.setItem('apiKey', apiKey)
    localStorage.setItem('selectedModel', selectedModel)
    setShowSettings(false)
  }

  const clearChat = () => {
    if (window.confirm('Tem certeza que deseja limpar todo o histórico de chat?')) {
      setMessages([])
    }
  }

  const exportChat = () => {
    const chatData = {
      messages,
      model: selectedModel,
      timestamp: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importChat = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (data.messages && Array.isArray(data.messages)) {
          setMessages(data.messages)
          if (data.model) setSelectedModel(data.model)
        }
      } catch (error) {
        alert('Erro ao importar arquivo. Verifique se é um arquivo válido.')
      }
    }
    reader.readAsText(file)
  }

  const selectedModelInfo = models.find(m => m.id === selectedModel)

  return (
    <div className={`chat-container${darkMode ? ' dark' : ''}`}>
      {/* Header */}
      <header className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Bot className="logo" />
            <div>
              <h1 style={{ fontWeight: 700, fontSize: '1.25rem' }}>ChatBot Platform</h1>
              {selectedModelInfo && (
                <p style={{ fontSize: '0.875rem', color: darkMode ? '#9ca3af' : '#6b7280' }}>
                  {selectedModelInfo.name} ({selectedModelInfo.provider})
                </p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={() => setDarkMode(!darkMode)} className="icon-btn" title="Alternar tema">
              {darkMode ? <Sun /> : <Moon />}
            </button>
            <button onClick={clearChat} className="icon-btn" title="Limpar chat">
              <Trash2 />
            </button>
            <button onClick={exportChat} className="icon-btn" title="Exportar chat">
              <Download />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="icon-btn" title="Importar chat">
              <Upload />
            </button>
            <button onClick={() => setShowSettings(!showSettings)} className="icon-btn" title="Configurações">
              <Settings />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={importChat}
              className="hidden"
            />
          </div>
        </div>
        {showSettings && (
          <div className="settings-panel">
            <div className="settings-grid">
              <div>
                <label>API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Insira sua API key (OpenAI, Anthropic ou Google)"
                />
              </div>
              <div>
                <label>Modelo</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.provider})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.5rem' }}>
                <button onClick={saveSettings} className="btn-primary">Salvar</button>
                {apiKey && (
                  <button onClick={() => setShowSettings(false)} className="btn-secondary">Cancelar</button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Chat messages */}
      <main className="chat-messages">
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: darkMode ? '#9ca3af' : '#6b7280' }}>
            <Bot className="logo" style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: '0.5rem' }}>
              Bem-vindo ao ChatBot Platform!
            </h3>
            <p>Configure sua API key e comece a conversar com IA.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.role}${message.isError ? ' error' : ''}`}
            >
              <div className="message-avatar">
                {message.role === 'user' ? <User /> : <Bot />}
              </div>
              <div className="message-content">
                <div className="message-text">{message.content}</div>
                <div className="message-meta">
                  {message.timestamp && typeof message.timestamp === "object"
                    ? message.timestamp.toLocaleTimeString()
                    : ""}
                  {message.model && ` • ${models.find(m => m.id === message.model)?.name}`}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="message assistant">
            <div className="message-avatar">
              <Bot />
            </div>
            <div className="message-content typing-indicator">
              <div className="typing-dots">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Chat input */}
      <footer className="chat-input">
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            className="chat-input-field"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="chat-input-send"
          >
            <Send />
          </button>
        </form>
      </footer>
    </div>
  )
}

export default App
