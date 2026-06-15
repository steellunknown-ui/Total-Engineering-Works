'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Bot, User, CornerDownLeft } from 'lucide-react'
import { chatbotGreetings, chatbotFAQ } from '@/config/chatbot'

type Message = {
  id: string
  text: string
  sender: 'bot' | 'user'
  timestamp: Date
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Initialize with a random greeting
  useEffect(() => {
    if (messages.length === 0) {
      const randomGreeting = chatbotGreetings[Math.floor(Math.random() * chatbotGreetings.length)]
      setMessages([
        {
          id: '1',
          text: randomGreeting,
          sender: 'bot',
          timestamp: new Date(),
        },
      ])
    }
  }, [messages.length])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const handleSend = async (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages
            .filter(m => m.id !== '1') // Don't send initial greeting to AI to keep context clean
            .concat(userMessage)
            .map(m => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.text
            }))
        })
      })

      const data = await response.json()
      
      if (data.error) throw new Error(data.error)

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply,
        sender: 'bot',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (error: any) {
      console.error('Chat Error:', error)
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having a bit of trouble connecting to my central brain. Please check your connection or contact our office for immediate assistance!",
        sender: 'bot',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="fixed bottom-8 right-8 z-[110]">
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center justify-center
          w-14 h-14 rounded-full
          bg-accent-primary text-white
          shadow-2xl shadow-accent-primary/20
          z-50
        "
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="
              absolute bottom-20 right-0
              w-[350px] md:w-[400px] h-[500px]
              bg-bg-elevated border border-border-hairline
              flex flex-col overflow-hidden
              shadow-2xl shadow-black/50
            "
          >
            {/* Header */}
            <div className="p-4 border-b border-border-hairline bg-bg-surface flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-[14px] text-text-primary leading-tight">
                  TEW AI Assistant
                </h3>
                <span className="font-mono text-[10px] text-accent-primary uppercase tracking-widest">
                  Online
                </span>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="
                flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-bg-void/30
                overscroll-contain
                [&::-webkit-scrollbar]:w-1
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-border-hairline
                hover:[&::-webkit-scrollbar-thumb]:bg-accent-primary/40
              "
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`
                      flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-1
                      ${msg.sender === 'user' ? 'bg-bg-surface' : 'bg-accent-primary/20'}
                    `}>
                      {msg.sender === 'user' ? <User size={12} className="text-text-secondary" /> : <Bot size={12} className="text-accent-primary" />}
                    </div>
                    <div className={`
                      p-3 rounded-none text-[13px] leading-relaxed
                      ${msg.sender === 'user' 
                        ? 'bg-accent-primary text-white' 
                        : 'bg-bg-surface border border-border-hairline text-text-secondary'}
                    `}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-bg-surface border border-border-hairline p-3 flex gap-1 items-center">
                    <span className="w-1 h-1 bg-text-muted rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-text-muted rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1 h-1 bg-text-muted rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(inputValue) }}
              className="p-4 border-t border-border-hairline bg-bg-surface flex gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about our capabilities..."
                className="
                  flex-1 bg-bg-void border border-border-hairline
                  px-4 py-2 text-[13px] text-text-primary
                  focus:outline-none focus:border-accent-primary
                  placeholder:text-text-muted/50
                "
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="
                  bg-accent-primary text-white p-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  hover:bg-accent-primary/90 transition-colors
                "
              >
                <Send size={18} />
              </button>
            </form>
            
            <div className="px-4 pb-2 bg-bg-surface flex items-center justify-between">
               <span className="font-mono text-[8px] text-text-muted uppercase tracking-tighter">
                 Powered by Midnight Engineering AI
               </span>
               <div className="flex items-center gap-1">
                 <CornerDownLeft size={8} className="text-text-muted" />
                 <span className="font-mono text-[8px] text-text-muted">Enter to send</span>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
