/**
 * Help Page with Gemini AI Assistant
 */

import { useState } from 'react';
import { Send, Sparkles, HelpCircle, Upload, Share2, Shield, Activity } from 'lucide-react';
import { getHelp, getQuickStart, explainFeature } from '../services/help';
import Button from '../components/Button';

export default function Help() {
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState([
        {
            type: 'assistant',
            text: "👋 Hi! I'm your SecureVault assistant. I'm here to help you understand how to use the platform and keep your files secure. What would you like to know?"
        }
    ]);
    const [loading, setLoading] = useState(false);

    const quickActions = [
        { label: 'Quick Start Guide', icon: Sparkles, action: 'quickstart' },
        { label: 'How to Upload Files', icon: Upload, action: 'upload' },
        { label: 'How to Share Files', icon: Share2, action: 'share' },
        { label: 'Emergency Lockdown', icon: Shield, action: 'lockdown' },
    ];

    const handleQuickAction = async (action) => {
        setLoading(true);

        let response;
        if (action === 'quickstart') {
            response = await getQuickStart();
        } else {
            response = await explainFeature(action);
        }

        setMessages(prev => [
            ...prev,
            { type: 'user', text: quickActions.find(a => a.action === action)?.label },
            { type: 'assistant', text: response }
        ]);
        setLoading(false);
    };

    const handleAskQuestion = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        const userQuestion = question;
        setQuestion('');
        setMessages(prev => [...prev, { type: 'user', text: userQuestion }]);
        setLoading(true);

        const response = await getHelp(userQuestion, 'help');
        setMessages(prev => [...prev, { type: 'assistant', text: response }]);
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-h1 font-semibold text-neutral-900">Help & Support</h1>
                <p className="text-neutral-600 mt-1">Get help from our AI assistant</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {quickActions.map((action) => (
                    <button
                        key={action.action}
                        onClick={() => handleQuickAction(action.action)}
                        disabled={loading}
                        className="card hover:shadow-card-hover transition-all text-left"
                    >
                        <action.icon className="w-5 h-5 text-primary mb-2" />
                        <p className="text-sm font-medium text-neutral-900">{action.label}</p>
                    </button>
                ))}
            </div>

            {/* Chat Interface */}
            <div className="card p-0 overflow-hidden">
                {/* Messages */}
                <div className="h-96 overflow-y-auto p-6 space-y-4">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-4 ${message.type === 'user'
                                        ? 'bg-primary text-white'
                                        : 'bg-neutral-100 text-neutral-900'
                                    }`}
                            >
                                {message.type === 'assistant' && (
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-4 h-4 text-primary" />
                                        <span className="text-xs font-medium text-primary">AI Assistant</span>
                                    </div>
                                )}
                                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-neutral-100 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <form onSubmit={handleAskQuestion} className="border-t border-neutral-200 p-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Ask me anything about SecureVault..."
                            className="input flex-1"
                            disabled={loading}
                        />
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={!question.trim() || loading}
                            loading={loading}
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </form>
            </div>

            {/* Common Questions */}
            <div className="card">
                <h3 className="text-h3 font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    Common Questions
                </h3>
                <div className="space-y-3">
                    <button
                        onClick={() => {
                            setQuestion("How secure is my data?");
                            handleAskQuestion({ preventDefault: () => { } });
                        }}
                        className="w-full text-left p-3 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                        <p className="text-sm font-medium text-neutral-900">How secure is my data?</p>
                    </button>
                    <button
                        onClick={() => {
                            setQuestion("What happens if I forget my password?");
                            handleAskQuestion({ preventDefault: () => { } });
                        }}
                        className="w-full text-left p-3 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                        <p className="text-sm font-medium text-neutral-900">What happens if I forget my password?</p>
                    </button>
                    <button
                        onClick={() => {
                            setQuestion("How do I revoke access to a file?");
                            handleAskQuestion({ preventDefault: () => { } });
                        }}
                        className="w-full text-left p-3 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                        <p className="text-sm font-medium text-neutral-900">How do I revoke access to a file?</p>
                    </button>
                </div>
            </div>
        </div>
    );
}
