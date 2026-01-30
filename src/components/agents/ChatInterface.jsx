import React, { useState, useEffect, useRef } from 'react';
import { agentSDK } from '@/agents';
import { InvokeLLM } from '@/integrations/Core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2 } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { Client } from '@/entities/Client';
import { BlogPost } from '@/entities/BlogPost';
import { SocialPost } from '@/entities/SocialPost';
import { FileDocument } from '@/entities/FileDocument';
import { toast } from 'sonner';

const CONFIRMATION_SEPARATOR = '---|||---Ready to upload to the library?';

export default function ChatInterface({ agent, conversationId, onConversationCreated }) {
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isAgentThinking, setIsAgentThinking] = useState(false);
    const [clientData, setClientData] = useState(null);
    const [knowledgeFiles, setKnowledgeFiles] = useState([]);
    const [pendingContent, setPendingContent] = useState(null);
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
    const viewportRef = useRef(null);

    const socialAgents = useRef([
        'social_media_writer'
    ]).current;

    useEffect(() => {
        const loadClientData = async () => {
            try {
                let clientInfo = await Client.list("name", 1);
                if (clientInfo.length > 0) {
                    setClientData(clientInfo[0]);
                }
            } catch (error) {
                console.error("Error loading client data:", error);
            }
        };
        loadClientData();
    }, []);

    useEffect(() => {
        const loadKnowledgeFiles = async () => {
            if (agent?.name) {
                try {
                    const agentSpecificFiles = await FileDocument.filter({ 
                        agent_name: agent.name 
                    });

                    const sharedFiles = await FileDocument.filter({
                        agent_name: 'shared'
                    });

                    const allFilesMap = new Map();
                    sharedFiles.forEach(file => allFilesMap.set(file.id, file));
                    agentSpecificFiles.forEach(file => allFilesMap.set(file.id, file));
                    
                    const combinedFiles = Array.from(allFilesMap.values());
                    setKnowledgeFiles(combinedFiles);

                } catch (error) {
                    console.error("Error loading knowledge base files:", error);
                    setKnowledgeFiles([]);
                }
            } else {
                setKnowledgeFiles([]);
            }
        };
        loadKnowledgeFiles();
    }, [agent]);
    
    useEffect(() => {
        const loadConversation = async () => {
            if (conversationId) {
                try {
                    setIsLoading(true);
                    const conv = await agentSDK.getConversation(conversationId);
                    setConversation(conv);
                    setMessages(conv.messages || []);
                } catch (error) {
                    console.error("Error loading conversation:", error);
                    setConversation(null);
                    setMessages([]);
                } finally {
                    setIsLoading(false);
                }
            } else {
                 setConversation(null);
                 setMessages([]);
                 setIsLoading(false);
                 setPendingContent(null);
                 setShowSaveConfirmation(false);
                 setIsAgentThinking(false);
            }
        };

        loadConversation();
    }, [conversationId]);
    
    useEffect(() => {
        if (conversation) {
            const unsubscribe = agentSDK.subscribeToConversation(conversation.id, (data) => {
                setMessages(data.messages || []);
            });
            return () => unsubscribe();
        }
    }, [conversation]);

    const saveSocialPost = async (contentToSave, originalPrompt) => {
        try {
            const channel = agent.name.replace('_content_creator', '');
            
            await SocialPost.create({
                channel: channel,
                content: contentToSave,
                original_prompt: originalPrompt || 'Generated content',
                status: 'Suggested',
                ai_generated: true
            });

            toast.success("Social post saved to Library", {
                description: `A new ${agent.display_name} post is now available in the Social Post Library.`,
                duration: 4000
            });

        } catch (error) {
            console.error("Error saving social post to library:", error);
            toast.error("Failed to save to Social Post Library", {
                description: "The post couldn't be saved. You can try again.",
                duration: 6000
            });
        }
    };
    
    const saveContentToLibrary = async (contentToSave, originalPrompt) => {
        if (agent?.name === 'blog_content_writer') {
            await saveBlogPost(contentToSave);
        } else if (socialAgents.includes(agent?.name)) {
            await saveSocialPost(contentToSave, originalPrompt);
        }
    };

    const saveBlogPost = async (contentToSave) => {
        try {
            const contentStartIndex = contentToSave.search(/<h[1-2][^>]*>|#\s/);
            const cleanContent = contentStartIndex !== -1 ? contentToSave.substring(contentStartIndex) : contentToSave;

            let title = 'AI Generated Blog Post';
            const titleMatch = cleanContent.match(/<h[1-2][^>]*>(.*?)<\/h[1-2]>|^#\s+(.+)/m);
            if (titleMatch) {
                title = (titleMatch[1] || titleMatch[2] || '').replace(/<[^>]*>/g, '').trim();
            }

            if (title.length > 100) {
                title = title.substring(0, 97) + '...';
            }
            
            await BlogPost.create({
                title: title,
                content: cleanContent,
                keywords: clientData?.focus_keywords || '',
                status: 'Draft',
                ai_generated: true
            });

            toast.success("Blog post saved to Library", {
                description: `"${title}" is now available in the Blog Library.`,
                duration: 4000
            });

        } catch (error) {
            console.error("Error saving blog content to library:", error);
            toast.error("Failed to save to Blog Library", {
                description: "The blog post couldn't be saved. You can try again.",
                duration: 6000
            });
        }
    };

    
    useEffect(() => {
        if (viewportRef.current) {
            viewportRef.current.scrollTo({
                top: viewportRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }

        const lastMessage = messages[messages.length - 1];

        if (isAgentThinking && lastMessage?.role === 'assistant') {
            setIsAgentThinking(false);
        }

        const isSavableAgent = agent?.name === 'blog_content_writer' || socialAgents.includes(agent?.name);
        
        if (isSavableAgent && lastMessage?.role === 'assistant' && lastMessage.content?.includes(CONFIRMATION_SEPARATOR)) {
            const parts = lastMessage.content.split(CONFIRMATION_SEPARATOR);
            const content = parts[0];
            setPendingContent(content);
            setShowSaveConfirmation(true);
        } else {
            if(lastMessage?.role === 'user' || (lastMessage?.role === 'assistant' && !lastMessage?.content?.includes(CONFIRMATION_SEPARATOR))) {
                setShowSaveConfirmation(false);
                setPendingContent(null);
            }
        }
    }, [messages, agent, isAgentThinking, socialAgents]);

    const generateConversationTitle = async (firstMessage) => {
        try {
            const response = await InvokeLLM({
                prompt: `Create a very short, concise title (4-6 words) for a conversation that starts with this message: "${firstMessage}". The title should capture the main topic or request. Examples: "Blog Ideas for Tech Startup", "Social Media Content Strategy", "SEO Keywords Research"`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        title: {
                            type: "string",
                            description: "A short, 4-6 word title for the conversation."
                        }
                    },
                    required: ["title"]
                }
            });
            return response.title;
        } catch (error) {
            console.error("Error generating title:", error);
            return firstMessage.length > 50 ? firstMessage.substring(0, 50) + '...' : firstMessage;
        }
    };

    const createConversationFromFirstMessage = async (firstMessage) => {
        setIsLoading(true);
        try {
            const conversationName = await generateConversationTitle(firstMessage);

            const newConv = await agentSDK.createConversation({
                agent_name: agent?.name,
                metadata: {
                    name: conversationName,
                }
            });
            
            if (onConversationCreated) {
                onConversationCreated(newConv);
            }
            
            setConversation(newConv);
            setMessages(newConv.messages || []);
            return newConv;
        } catch (error) {
            console.error("Error creating conversation:", error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (messageText) => {
        const contentToSend = messageText || userInput;
        if (!contentToSend.trim() || !agent) return;

        setUserInput('');
        setShowSaveConfirmation(false);
        setIsAgentThinking(true);

        try {
            let currentConversation = conversation;
            
            if (!currentConversation) {
                currentConversation = await createConversationFromFirstMessage(contentToSend);
                if (!currentConversation) {
                    setUserInput(contentToSend);
                    setIsAgentThinking(false);
                    return;
                }
            }

            const finalMessageContent = createAgentContext(clientData, contentToSend);

            await agentSDK.addMessage(currentConversation, {
                role: 'user',
                content: finalMessageContent,
            });
            
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Message Failed to Send", {
                description: "There was a problem sending your message. Please try again in a moment.",
                duration: 6000
            });
            setUserInput(contentToSend);
            setIsAgentThinking(false);
        }
    };

    const handleConfirmation = async (shouldSave) => {
        setShowSaveConfirmation(false);
        if (shouldSave) {
            if (pendingContent) {
                const lastUserMessage = displayedMessages.filter(msg => msg.role === 'user').pop();
                const originalPrompt = lastUserMessage?.content || 'Generated content';
                
                await saveContentToLibrary(pendingContent, originalPrompt);
                setPendingContent(null);
            }
        } else {
            setPendingContent(null);
            toast.info("You can type your revisions below.", { duration: 3000 });
        }
    };

    const createAgentContext = (clientSettings, userMessage) => {
        if (agent?.name === 'general_content_assistant') {
            return userMessage;
        }
        
        const agentName = agent?.display_name || agent?.name?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Content Creator';
        
        let context = `You are ${agentName}. The user's request is: "${userMessage}"`;

        if (knowledgeFiles.length > 0) {
            context += `\n\n**IMPORTANT CONTEXT**: The user has uploaded ${knowledgeFiles.length} reference document(s) to the knowledge base. These include files like: ${knowledgeFiles.map(f => f.filename).slice(0, 3).join(', ')}${knowledgeFiles.length > 3 ? ` and ${knowledgeFiles.length - 3} more` : ''}. Use your understanding of best practices for this type of content creation, keeping in mind that there are likely specific brand guidelines, style requirements, or reference materials that should inform your response.`;
        }
        
        if (clientSettings) {
            context += `\n\nCOMPANY & WRITING DIRECTIVES:
- Company: ${clientSettings.name}
- Industry: ${clientSettings.industry || 'Not specified'}
- Business Focus: ${clientSettings.service_details || 'General business services'}`;

            if (clientSettings.focus_keywords) {
                context += `
- SEO Keywords (select 1-3 strategically): ${clientSettings.focus_keywords}`;
            }

            if (clientSettings.ai_writing_directives) {
                context += `
- Writing Guidelines: ${clientSettings.ai_writing_directives}`;
            }
        }

        const isSavableAgent = agent?.name === 'blog_content_writer' || socialAgents.includes(agent?.name);
        if (isSavableAgent) {
             context += `

CRITICAL OUTPUT INSTRUCTION: Your response MUST be ONLY the generated content. Do NOT include any conversational preamble, introductions, or explanations like "Here is the content you requested:". The output must be ready for direct storage. AFTER the complete content, you MUST append this exact string: "${CONFIRMATION_SEPARATOR}" (without quotes). This separator signals the completion of the content and readiness for review/saving.`;
        }
       
        return context;
    };

    const agentDisplayName = agent?.display_name || agent?.name?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'AI Agent';
    
    const displayedMessages = messages.map(msg => {
        if (msg.role === 'assistant' && msg.content?.includes(CONFIRMATION_SEPARATOR)) {
            return { ...msg, content: msg.content.split(CONFIRMATION_SEPARATOR)[0] };
        }
        if (msg.role === 'user' && msg.content?.includes("COMPANY & WRITING DIRECTIVES:")) {
            const match = msg.content.match(/The user's request is: "(.*?)"/s);
            const originalContent = match ? match[1] : "Processing request...";
            return { ...msg, content: originalContent };
        }
        return msg;
    });

    return (
        <div className="flex flex-col h-full">
            <div className="border-b border-slate-200 p-4 bg-white">
                <h2 className="font-semibold text-slate-900 text-lg flex items-center gap-2 font-sans">
                    {agentDisplayName}
                    {(agent?.name === 'blog_content_writer' || socialAgents.includes(agent?.name)) && (
                        <span className="text-sm bg-blue-600 text-white px-2 py-1 rounded-full font-sans">
                            Library-Enabled
                        </span>
                    )}
                </h2>
                <div className="text-sm text-slate-500 mt-1 flex items-center gap-4">
                    <span>
                        Ready to create content.
                    </span>
                    {knowledgeFiles.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium font-sans">
                            {knowledgeFiles.length} reference file(s) available
                        </span>
                    )}
                </div>
            </div>

            <ScrollArea className="flex-1 p-4 bg-slate-50" ref={viewportRef}>
                {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {displayedMessages.map((message, index) => (
                                <MessageBubble key={message.id || index} message={message} agent={agent} />
                            ))}
                        </div>
                        {isAgentThinking && (
                            <MessageBubble message={{ role: 'assistant' }} isTyping={true} />
                        )}
                    </>
                )}
            </ScrollArea>

            <div className="border-t border-slate-200 p-4 bg-white">
                 {showSaveConfirmation && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-semibold text-green-800 text-center sm:text-left font-sans">Ready to save to the library?</p>
                        <div className="flex gap-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleConfirmation(true)}>Yes, Save</Button>
                            <Button size="sm" variant="outline" onClick={() => handleConfirmation(false)}>No, I have changes</Button>
                        </div>
                    </div>
                )}
                <div className="flex gap-2">
                    <Input
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={showSaveConfirmation ? "Type here to make revisions..." : "Ask me to create content..."}
                        className="flex-1"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        disabled={isAgentThinking}
                    />
                    <Button 
                        onClick={() => handleSendMessage()} 
                        disabled={!userInput.trim() || isAgentThinking}
                        className="bg-slate-800 hover:bg-slate-900 text-white"
                    >
                        {isAgentThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}