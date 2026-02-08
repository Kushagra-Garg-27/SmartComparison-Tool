import React, { useState, useEffect, useRef } from 'react';
import { Product, Review, AnalysisResult, ViewState, ChatMessage } from '../types';
import { X, MessageSquare, Tag, Sparkles, Send, ChevronRight, Minimize2, Lightbulb, LineChart } from 'lucide-react';
import { ComparisonTable } from './ComparisonTable';
import { chatWithShopper } from '../services/geminiService';
import { PriceHistoryService } from '../services/priceHistoryService';
import { PriceHistoryChart } from './PriceHistoryChart';
import { PriceInsights } from './PriceInsights';
import { GenerateContentResponse } from '@google/genai';

interface SmartOverlayProps {
  currentProduct: Product;
  competitors: Product[];
  reviews: Review[];
  analysis: AnalysisResult | null;
  loading: boolean;
  viewState: ViewState;
  setViewState: (state: ViewState) => void;
  onRefreshPrices: () => void;
  isRefreshingPrices: boolean;
  lastUpdated: Date;
  isPanelMode?: boolean;
}

export const SmartOverlay: React.FC<SmartOverlayProps> = ({
  currentProduct,
  competitors,
  reviews,
  analysis,
  loading,
  viewState,
  setViewState,
  onRefreshPrices,
  isRefreshingPrices,
  lastUpdated,
  isPanelMode = false
}) => {
  const [activeTab, setActiveTab] = useState<'compare' | 'history' | 'chat'>('compare');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  const handleSendChat = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', text: input };
    setChatHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const context = `Current: ${currentProduct.title} ($${currentProduct.price}). Competitors: ${competitors.length} available. Analysis: ${analysis?.summary}`;
      const responseStream = await chatWithShopper(chatHistory, userMsg.text, context);
      
      let fullResponse = '';
      setChatHistory(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of responseStream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          fullResponse += c.text;
          setChatHistory(prev => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1].text = fullResponse;
            return newHistory;
          });
        }
      }
    } catch (e) {
      console.error(e);
      setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting to Gemini right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Get Historical Data
  const historyData = PriceHistoryService.getHistory(currentProduct.id);

  if (viewState === ViewState.HIDDEN) return null;

  // Minimized Bubble State - Only show if NOT in panel mode
  if (viewState === ViewState.MINIMIZED && !isPanelMode) {
    return (
      <div 
        className="fixed bottom-6 right-6 z-50 animate-bounce-in"
      >
        <button
          onClick={() => setViewState(ViewState.EXPANDED)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center space-x-2"
        >
          <Sparkles className="h-6 w-6" />
          <span className="font-semibold">Smart Compare</span>
          {analysis && (
            <span className="bg-white text-purple-600 text-xs font-bold px-2 py-0.5 rounded-full">
              -${(currentProduct.price - (competitors.find(c => c.id === analysis.bestPriceId)?.price || 0)).toFixed(0)}
            </span>
          )}
        </button>
      </div>
    );
  }

  // Determine container classes based on mode
  const containerClasses = isPanelMode 
    ? "relative h-screen w-full bg-white flex flex-col" // Full screen for Side Panel
    : "fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 transition-transform duration-300 transform translate-x-0"; // Floating overlay

  // Expanded Overlay State (or Panel Mode)
  return (
    <div className={containerClasses}>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-blue-900 text-white p-4 flex items-center justify-between shadow-md flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-yellow-300" />
          <h2 className="text-lg font-bold">SmartCompare AI</h2>
        </div>
        
        {/* Only show window controls if NOT in panel mode */}
        {!isPanelMode && (
          <div className="flex items-center space-x-2">
            <button onClick={() => setViewState(ViewState.MINIMIZED)} className="p-1 hover:bg-white/10 rounded">
              <Minimize2 className="h-4 w-4" />
            </button>
            <button onClick={() => setViewState(ViewState.HIDDEN)} className="p-1 hover:bg-white/10 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-gray-500 animate-pulse">Gemini is analyzing market data...</p>
          </div>
        ) : !analysis ? (
           <div className="p-6 text-center text-red-500">
             {isPanelMode ? "Select a product to compare (Demo Mode Active)" : "Analysis failed. Check API Key."}
           </div>
        ) : (
          <>
            {/* AI Summary Card (Only show on Compare tab to save space on others) */}
            {activeTab === 'compare' && (
              <div className="p-4 bg-white m-3 rounded-lg shadow-sm border border-purple-100">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Gemini Verdict</h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      {analysis.summary}
                    </p>
                    <div className="mt-2 text-xs font-medium text-purple-700 bg-purple-50 inline-block px-2 py-1 rounded">
                      Recommendation: {analysis.recommendation}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="px-4 border-b border-gray-200 bg-white sticky top-0 z-10">
              <div className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('compare')}
                  className={`flex-1 py-3 px-1 text-center border-b-2 text-sm font-medium ${
                    activeTab === 'compare'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Tag className="inline-block h-4 w-4 mr-2" />
                  Compare
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-3 px-1 text-center border-b-2 text-sm font-medium ${
                    activeTab === 'history'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <LineChart className="inline-block h-4 w-4 mr-2" />
                  History
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-3 px-1 text-center border-b-2 text-sm font-medium ${
                    activeTab === 'chat'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <MessageSquare className="inline-block h-4 w-4 mr-2" />
                  Ask
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {activeTab === 'compare' && (
                <div className="space-y-6">
                  {/* Price Table */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                     <ComparisonTable 
                       currentProduct={currentProduct}
                       competitors={competitors}
                       bestPriceId={analysis.bestPriceId}
                       bestValueId={analysis.bestValueId}
                       trustWarningId={analysis.trustWarningId}
                       onRefreshPrices={onRefreshPrices}
                       isRefreshingPrices={isRefreshingPrices}
                       lastUpdated={lastUpdated}
                     />
                  </div>

                  {/* Smart Alternatives */}
                  {analysis.alternatives && analysis.alternatives.length > 0 && (
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-100 p-3">
                      <div className="flex items-center space-x-2 mb-3">
                        <Lightbulb className="h-4 w-4 text-indigo-600" />
                        <h4 className="text-xs font-bold text-indigo-800 uppercase">Consider These Alternatives</h4>
                      </div>
                      <div className="space-y-2">
                        {analysis.alternatives.map((alt, idx) => (
                          <div key={idx} className="bg-white rounded p-2 flex justify-between items-center shadow-sm">
                             <div>
                               <div className="text-xs font-semibold text-gray-900">{alt.title}</div>
                               <div className="text-[10px] text-gray-500">{alt.reason}</div>
                             </div>
                             <div className="text-xs font-bold text-indigo-700">~${alt.price}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pros & Cons */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                       <h4 className="text-xs font-bold text-green-800 uppercase mb-2">Pros</h4>
                       <ul className="text-xs text-green-900 space-y-1">
                         {analysis.pros.map((p, i) => <li key={i} className="flex items-start"><ChevronRight className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0"/>{p}</li>)}
                       </ul>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                       <h4 className="text-xs font-bold text-red-800 uppercase mb-2">Cons</h4>
                       <ul className="text-xs text-red-900 space-y-1">
                         {analysis.cons.map((c, i) => <li key={i} className="flex items-start"><ChevronRight className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0"/>{c}</li>)}
                       </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <PriceHistoryChart 
                    data={historyData} 
                    productTitle={currentProduct.title} 
                  />
                  
                  <PriceInsights 
                    history={historyData} 
                    currentPrice={currentProduct.price}
                  />
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="flex flex-col h-[400px]">
                  <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                    {chatHistory.length === 0 && (
                      <div className="text-center text-gray-400 text-sm mt-10">
                        Ask about return policies, compatibility, or specific specs.
                      </div>
                    )}
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                          msg.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-800'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 animate-pulse">
                          Thinking...
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                      placeholder="Ask about this product..."
                      className="w-full border border-gray-300 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                      onClick={handleSendChat}
                      className="absolute right-1 top-1 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                    >
                      <Send className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Footer */}
      <div className="bg-gray-100 p-2 text-center text-xs text-gray-400 border-t flex-shrink-0">
        Powered by Gemini 3.0 • Hackathon Demo
      </div>
    </div>
  );
};