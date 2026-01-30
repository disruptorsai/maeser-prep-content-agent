
import React, { useState, useEffect, useCallback } from 'react';
import { agentSDK } from '@/agents';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit, MessageSquare, Files, BookOpen, Star } from 'lucide-react';
import ChatInterface from '../components/agents/ChatInterface';
import KnowledgeBase from '../components/agents/KnowledgeBase';
import TrainingInterface from '../components/agents/TrainingInterface';
import FeedbackLoop from '../components/agents/FeedbackLoop';
import ChatHistoryPanel from '../components/agents/ChatHistoryPanel';
import { toast } from 'sonner';

const DELETED_CONVOS_KEY = 'deleted_conversation_ids';

export default function AIAgents() {
    const [activeTab, setActiveTab] = useState('chat');
    
    const [clientAgents, setClientAgents] = useState([]);
    const [selectedAgentName, setSelectedAgentName] = useState(null);
    const [loading, setLoading] = useState(true);

    const [conversations, setConversations] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState(null);

    const loadClientAgents = useCallback(async () => {
        setLoading(true);
        try {
            const clientAgentConfigs = [
                {
                    name: 'general_content_assistant',
                    display_name: 'General Content Assistant',
                    description: 'A versatile AI for general questions and content creation.'
                },
                {
                    name: 'content_idea_generator',
                    display_name: 'Content Idea Generator',
                    description: 'Generates creative content ideas, blog titles, and content outlines.'
                },
                {
                    name: 'seo_optimizer',
                    display_name: 'SEO Optimizer',
                    description: 'Provides expert SEO insights, keyword strategies, and content recommendations.'
                },
                {
                    name: 'blog_content_writer',
                    display_name: 'Blog Content Writer',
                    description: 'Writes SEO-optimized blog posts, articles, and long-form content.'
                },
                {
                    name: 'social_media_writer',
                    display_name: 'Social Media Writer',
                    description: 'Generates engaging posts for various social media platforms.'
                },
                {
                    name: 'email_marketing_specialist',
                    display_name: 'Email Marketing Specialist',
                    description: 'Designs email campaigns, newsletters, and automated sequences.'
                },
                {
                    name: 'website_content_specialist',
                    display_name: 'Website Content Specialist',
                    description: 'Creates web pages, landing pages, and website copy.'
                },
                {
                    name: 'instagram_content_creator',
                    display_name: 'Instagram Content Creator',
                    description: 'Specialized in creating engaging Instagram posts, stories, and reels.'
                },
                {
                    name: 'facebook_content_creator',
                    display_name: 'Facebook Content Creator',
                    description: 'Develops Facebook posts, ads, and community content.'
                },
                {
                    name: 'tiktok_content_creator',
                    display_name: 'TikTok Content Creator',
                    description: 'Generates viral TikTok video concepts, scripts, and trends.'
                },
                {
                    name: 'youtube_content_creator',
                    display_name: 'YouTube Content Creator',
                    description: 'Creates YouTube video scripts, titles, descriptions, and series concepts.'
                },
                {
                    name: 'reddit_content_creator',
                    display_name: 'Reddit Content Creator',
                    description: 'Crafts Reddit posts and comments that add value to communities.'
                },
                {
                    name: 'twitter_content_creator',
                    display_name: 'X (Twitter) Content Creator',
                    description: 'Develops engaging X (Twitter) posts, threads, and real-time content.'
                },
                {
                    name: 'linkedin_content_creator',
                    display_name: 'LinkedIn Content Creator',
                    description: 'Creates professional LinkedIn content for thought leadership and networking.'
                }
            ];

            setClientAgents(clientAgentConfigs);
            
            if (!selectedAgentName) {
                setSelectedAgentName('general_content_assistant');
            }
        } catch (error) {
            console.error("Failed to load client agents", error);
        } finally {
            setLoading(false);
        }
    }, [selectedAgentName]);

    const loadConversations = useCallback(async () => {
        if (!selectedAgentName) return;
        
        setLoading(true);
        try {
            const allConvos = await agentSDK.listConversations({ 
                agent_name: selectedAgentName 
            });
            
            const deletedIds = JSON.parse(localStorage.getItem(DELETED_CONVOS_KEY) || '[]');
            const clientConversations = allConvos.filter(c => !deletedIds.includes(c.id));
            
            setConversations(clientConversations);
        } catch (error) {
            console.error("Failed to load conversations", error);
        } finally {
            setLoading(false);
        }
    }, [selectedAgentName]);

    useEffect(() => {
        loadClientAgents();
    }, [loadClientAgents]);

    useEffect(() => {
        if (selectedAgentName) {
            loadConversations();
            setSelectedConversationId(null);
        } else {
            setConversations([]);
            setSelectedConversationId(null);
        }
    }, [selectedAgentName, loadConversations]);

    const handleSelectConversation = (id) => {
        setSelectedConversationId(id);
    };

    const handleNewConversation = () => {
        setSelectedConversationId(null);
    };
    
    const handleConversationCreated = (newConversation) => {
        setConversations(prev => [newConversation, ...prev]);
        setSelectedConversationId(newConversation.id);
    };

    const handleDeleteConversation = async (conversationId) => {
        if (window.confirm("Are you sure you want to hide this chat? It will remain hidden on this browser.")) {
            const deletedIds = JSON.parse(localStorage.getItem(DELETED_CONVOS_KEY) || '[]');
            if (!deletedIds.includes(conversationId)) {
                deletedIds.push(conversationId);
            }
            localStorage.setItem(DELETED_CONVOS_KEY, JSON.stringify(deletedIds));

            setConversations(prev => prev.filter(c => c.id !== conversationId));
            if (selectedConversationId === conversationId) {
                setSelectedConversationId(null);
            }
            toast.info("Conversation hidden.");
        }
    };

    const handleAgentSelect = (newAgentName) => {
        setSelectedAgentName(newAgentName);
    };

    const selectedAgent = clientAgents.find(a => a.name === selectedAgentName);

    if (loading && clientAgents.length === 0) {
        return (
            <div className="p-4 sm:p-6 h-full flex flex-col items-center justify-center bg-slate-50">
                <div className="text-center bg-white p-8 rounded-xl shadow-sm border">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-800 mx-auto mb-4"></div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2 font-sans">Loading AI Agents</h3>
                    <p className="text-slate-500">Please wait while the agents are being configured.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="pl-6 border-l-4 border-slate-800">
                        <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3 font-sans">
                            <BrainCircuit className="w-8 h-8 text-slate-800" />
                            AI Content Agents
                        </h1>
                        <p className="text-slate-600 mt-2 text-lg">
                            Select a specialized agent to begin content creation.
                        </p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-white h-auto p-2 rounded-xl border shadow-sm">
                        <TabsTrigger value="chat" className="h-full py-3 px-4 text-sm font-semibold data-[state=active]:bg-slate-100 data-[state=active]:shadow-sm data-[state=active]:text-slate-800 transition-all duration-300 flex items-center justify-center gap-2 rounded-lg font-sans">
                            <MessageSquare className="w-4 h-4" /> <span className="hidden md:inline">Chat</span>
                        </TabsTrigger>
                        <TabsTrigger value="training" className="h-full py-3 px-4 text-sm font-semibold data-[state=active]:bg-slate-100 data-[state=active]:shadow-sm data-[state=active]:text-slate-800 transition-all duration-300 flex items-center justify-center gap-2 rounded-lg font-sans">
                            <BookOpen className="w-4 h-4" /> <span className="hidden md:inline">Training</span>
                        </TabsTrigger>
                        <TabsTrigger value="knowledge" className="h-full py-3 px-4 text-sm font-semibold data-[state=active]:bg-slate-100 data-[state=active]:shadow-sm data-[state=active]:text-slate-800 transition-all duration-300 flex items-center justify-center gap-2 rounded-lg font-sans">
                            <Files className="w-4 h-4" /> <span className="hidden md:inline">Knowledge</span>
                        </TabsTrigger>
                        <TabsTrigger value="feedback" className="h-full py-3 px-4 text-sm font-semibold data-[state=active]:bg-slate-100 data-[state=active]:shadow-sm data-[state=active]:text-slate-800 transition-all duration-300 flex items-center justify-center gap-2 rounded-lg font-sans">
                            <Star className="w-4 h-4" /> <span className="hidden md:inline">Feedback</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="chat" className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-300px)]">
                            <div className="lg:col-span-1 h-full">
                                <ChatHistoryPanel
                                    conversations={conversations}
                                    selectedConversationId={selectedConversationId}
                                    onSelectConversation={handleSelectConversation}
                                    onNewConversation={handleNewConversation}
                                    onDeleteConversation={handleDeleteConversation}
                                    loading={loading}
                                    selectedAgent={selectedAgent}
                                    agents={clientAgents}
                                    onAgentChange={handleAgentSelect}
                                />
                            </div>
                            <div className="lg:col-span-3 h-full">
                                <ChatInterface
                                    key={`${selectedAgentName}-${selectedConversationId || 'new'}`}
                                    agent={selectedAgent}
                                    conversationId={selectedConversationId}
                                    onConversationCreated={handleConversationCreated}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="training" className="mt-6">
                        <TrainingInterface agent={selectedAgent} />
                    </TabsContent>

                    <TabsContent value="knowledge" className="mt-6">
                        <KnowledgeBase agentName={selectedAgentName} agents={clientAgents} />
                    </TabsContent>

                    <TabsContent value="feedback" className="mt-6">
                        <FeedbackLoop agentName={selectedAgentName} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
