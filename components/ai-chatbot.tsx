"use client";
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, Sparkles, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! 👋 I\'m your Wagashi assistant. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load product data on mount
  useEffect(() => {
    const loadProductData = async () => {
      const supabase = createClient();
      
      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .neq('product_id', 0); // Exclude the test product

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('category')
        .select('cat_id, cat_name, cat_jp');

      // Fetch subcategories
      const { data: subCategoriesData } = await supabase
        .from('sub_category')
        .select('subc_id, subc_name, subc_jp, cat_id');

      // Format product catalog for AI
      let catalogText = 'WAGASHI PRODUCT CATALOG:\n\n';
      
      // Add categories with subcategories
      if (categoriesData && subCategoriesData) {
        catalogText += 'CATEGORIES:\n';
        categoriesData.forEach(cat => {
          catalogText += `${cat.cat_id}. ${cat.cat_name} (${cat.cat_jp})\n`;
          const subs = subCategoriesData.filter(sub => sub.cat_id === cat.cat_id);
          subs.forEach(sub => {
            catalogText += `   - ${sub.subc_id}. ${sub.subc_name} (${sub.subc_jp})\n`;
          });
        });
        catalogText += '\n';
      }

      // Add products
      if (productsData) {
        catalogText += 'PRODUCTS:\n';
        productsData.forEach(product => {
          catalogText += `
ID: ${product.product_id}
Name: ${product.product_name} (${product.product_jp})
Price: ₱${product.product_price}
Description: ${product.product_desc}
Category: ${product.product_category}
Subcategory: ${product.product_subcategory}
Stock: ${product.stock_level > 0 ? 'In Stock' : 'Out of Stock'}
---`;
        });
      }

      setCategories(catalogText);
    };

    loadProductData();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userQuery = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Check if API key exists
      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured');
      }

      // Build context with product data
      const systemPrompt = `You are a helpful assistant for Wagashi, a Japanese confectionery store.

${categories}

INSTRUCTIONS:
- Help customers find products by name, category, price range, or type
- Provide accurate product information including prices, descriptions, and availability
- Recommend products based on customer preferences
- Answer questions about Japanese sweets and confections
- Mention prices in Philippine Pesos (₱)
- If a product is out of stock, mention it and suggest alternatives
- Be friendly, concise, and helpful
- Use emojis occasionally to be engaging
- Keep responses under 200 words unless detailed explanation is needed

When customers ask about products:
1. Search the catalog above for relevant items
2. Provide specific product names, prices, and descriptions
3. Mention if items are in stock or out of stock
4. Suggest similar products when appropriate`;

      // Build conversation history
      const conversationContext = messages
        .filter((m) => m.id !== '1')
        .map((m) => `${m.role === 'user' ? 'Customer' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const fullPrompt = `${systemPrompt}

${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ''}Current question: ${userQuery}`;

      console.log('Sending to Gemini:', { promptLength: fullPrompt.length });

      // Call Google Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: fullPrompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
            ],
          }),
        }
      );

      const data = await response.json();
      console.log('Gemini response:', data);

      // Check for API errors
      if (data.error) {
        console.error('Gemini API error:', data.error);
        throw new Error(data.error.message || 'API request failed');
      }

      // Check if response was blocked by safety filters
      if (data.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error('Response was blocked by safety filters');
      }

      // Extract text from Gemini response
      const assistantText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!assistantText) {
        console.error('No text in response:', data);
        throw new Error('No response generated');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error details:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error 
          ? `Error: ${error.message}. Please check your API key and try again.`
          : "Sorry, I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { icon: '🍡', text: 'Show mochi', query: 'Show me mochi products' },
    { icon: '🍰', text: 'Sweet options', query: 'What sweet options do you have?' },
    { icon: '🎁', text: 'Gift sets', query: 'Do you have gift sets?' },
    { icon: '💰', text: 'Budget picks', query: 'What products are under ₱150?' },
  ];

  const handleQuickAction = (query: string) => {
    setInput(query);
    inputRef.current?.focus();
  };

  return (
    <>
      {/* Speed Dial Button */}
      {!isOpen && (
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="btn btn-circle btn-primary btn-lg shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-110 group"
            aria-label="Open chat"
          >
            <MessageCircle className="h-6 w-6 group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-8 right-8 z-50 w-[400px] h-[650px] flex flex-col bg-base-100 rounded-3xl shadow-2xl border border-base-300/50 backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-bottom-8 fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-base-200 rounded-t-3xl bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full border-2 border-base-100"></div>
              </div>
              <div>
                <h3 className="font-semibold text-base">Wagashi AI</h3>
                <p className="text-xs text-base-content/60">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="btn btn-ghost btn-sm btn-circle hover:bg-base-200"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-content' 
                      : 'bg-gradient-to-br from-secondary to-accent text-white'
                  }`}>
                    {message.role === 'user' ? (
                      <span className="text-xs font-semibold">You</span>
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className="flex flex-col">
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-content rounded-tr-sm'
                          : 'bg-base-200 text-base-content rounded-tl-sm'
                      } shadow-sm`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <span className={`text-[10px] text-base-content/40 mt-1 px-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[85%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-base-200 rounded-tl-sm shadow-sm">
                    <div className="flex gap-1 items-center">
                      <Loader2 className="h-4 w-4 animate-spin text-base-content/40" />
                      <span className="text-sm text-base-content/60">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && !isLoading && (
            <div className="px-6 pb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-base-content/70">Quick actions</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.query)}
                    className="btn btn-sm btn-ghost justify-start gap-2 hover:bg-base-200 border border-base-300 rounded-xl"
                  >
                    <span className="text-base">{action.icon}</span>
                    <span className="text-xs">{action.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="px-6 py-4 border-t border-base-200 bg-base-50 rounded-b-3xl">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="input input-bordered w-full rounded-xl pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-base-100"
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="btn btn-primary btn-circle shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center justify-center gap-1 mt-3">
              <span className="text-[10px] text-base-content/40">Powered by</span>
              <span className="text-[10px] font-semibold text-primary">Google Gemini</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}