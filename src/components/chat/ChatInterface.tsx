/**
 * ChatInterface - React Component for Real-time SIM-ONE Chat
 * 
 * Implements interactive chat functionality with the SIM-ONE Framework.
 * Follows Law 5 (Protocolic Governance) for structured message handling.
 */

import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../../lib/simone-client';

interface ChatInterfaceProps {
  isAuthenticated?: boolean;
  userId?: string;
  sessionId?: string;
}

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Avatar */}
        <div className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isUser 
              ? 'bg-blue-600 text-white' 
              : isSystem 
                ? 'bg-gray-500 text-white'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
          }`}>
            {isUser ? 'U' : isSystem ? 'S' : 'S1'}
          </div>
          
          {/* Message Content */}
          <div className={`relative ${isUser ? 'text-right' : 'text-left'}`}>
            {/* Message Bubble */}
            <div className={`inline-block px-4 py-2 rounded-2xl ${
              isUser 
                ? 'bg-blue-600 text-white' 
                : isSystem
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-sm'
            }`}>
              {/* Processing indicator */}
              {message.status === 'processing' && (
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">SIM-ONE is thinking...</span>
                </div>
              )}
              
              {/* Message content */}
              {message.content && (
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              )}
              
              {/* Error indicator */}
              {message.status === 'error' && (
                <div className="flex items-center space-x-2 mt-2 text-red-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Failed to send</span>
                </div>
              )}
            </div>
            
            {/* Timestamp and metadata */}
            <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
              {new Date(message.timestamp).toLocaleTimeString()}
              {message.metadata && message.metadata.qualityScore && (
                <span className="ml-2">
                  Quality: {Math.round(message.metadata.qualityScore * 100)}%
                </span>
              )}
              {message.metadata && message.metadata.style && (
                <span className="ml-2">
                  Style: {message.metadata.style}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  isAuthenticated = false, 
  userId, 
  sessionId: initialSessionId 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(initialSessionId || '');
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [inputValue]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: `welcome-${Date.now()}`,
        content: "Welcome to SIM-ONE! I'm powered by a revolutionary five-agent cognitive governance framework. How can I help you today?",
        role: 'system',
        timestamp: Date.now(),
        status: 'completed'
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: inputValue.trim(),
      role: 'user',
      timestamp: Date.now(),
      status: 'completed'
    };

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      content: '',
      role: 'assistant',
      timestamp: Date.now(),
      status: 'processing'
    };

    // Add messages to UI immediately
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat/send-simone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          context: messages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')
        })
      });

      // Handle response parsing with better error handling
      let data;
      const responseText = await response.text();
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response text:', responseText);
        throw new Error('Invalid JSON response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Update messages with the SIM-ONE Framework response
      setMessages(prev => {
        const newMessages = [...prev];
        const assistantIndex = newMessages.findIndex(msg => msg.id === assistantMessage.id);
        
        if (assistantIndex !== -1) {
          newMessages[assistantIndex] = {
            id: assistantMessage.id,
            content: data.message,
            role: 'assistant',
            timestamp: Date.now(),
            status: 'completed',
            metadata: data.metadata
          };
        }
        
        return newMessages;
      });

      // Log SIM-ONE Framework processing details
      if (data.metadata?.provider === 'simone_framework') {
        console.log('🎉 SIM-ONE Framework Response:');
        console.log('- Style:', data.metadata.style);
        console.log('- Quality Score:', data.metadata.quality_score + '%');
        console.log('- Processing Time:', data.metadata.processing_time + 's');
        console.log('- Protocols Applied:', data.metadata.protocols_applied?.join(', '));
        console.log('- Workflow:', data.metadata.workflow);
      } else if (data.metadata?.provider === 'openai_fallback') {
        console.log('⚠️ Using OpenAI Fallback Mode');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update assistant message with error
      setMessages(prev => {
        const newMessages = [...prev];
        const assistantIndex = newMessages.findIndex(msg => msg.id === assistantMessage.id);
        
        if (assistantIndex !== -1) {
          newMessages[assistantIndex] = {
            ...assistantMessage,
            content: 'I apologize, but I encountered an error processing your request. Please try again.',
            status: 'error'
          };
        }
        
        return newMessages;
      });

      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setSessionId('');
    setError(null);
    
    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: `welcome-${Date.now()}`,
      content: "Welcome to SIM-ONE! I'm powered by a revolutionary five-agent cognitive governance framework. How can I help you today?",
      role: 'system',
      timestamp: Date.now(),
      status: 'completed'
    };
    setMessages([welcomeMessage]);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S1</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">SIM-ONE Chat</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isAuthenticated ? 'Authenticated Session' : 'Guest Mode'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={startNewChat}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="New Chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="flex items-end space-x-3">
          {/* File Upload Button */}
          <button 
            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Attach File"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
            </svg>
          </button>

          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message SIM-ONE..."
              rows={1}
              className="w-full px-4 py-3 pr-12 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              style={{ minHeight: '44px', maxHeight: '200px' }}
              disabled={isLoading}
            />
            
            {/* Send Button */}
            <button 
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 bottom-2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Input Footer */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Press Enter to send, Shift+Enter for new line</span>
            {isAuthenticated && (
              <span className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span>Authenticated</span>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span>{inputValue.length}</span>
            <span>/</span>
            <span>4000</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

