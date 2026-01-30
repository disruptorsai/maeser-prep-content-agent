import React, { useState, useEffect, useCallback } from 'react';
import { BlogPost } from '@/entities/BlogPost';
import PostList from '../components/blog/PostList';
import PostEditorModal from '../components/blog/PostEditorModal';
import FileUploadZone from '../components/files/FileUploadZone';
import { UploadFile, InvokeLLM } from '@/integrations/Core';
import { FileText, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BlogLibrary() {
    const [blogPosts, setBlogPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [editingPost, setEditingPost] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [uploading, setUploading] = useState(false);

    const loadBlogPosts = useCallback(async () => {
        setLoadingPosts(true);
        try {
            const postData = await BlogPost.list('-created_date');
            setBlogPosts(postData);
        } catch (error) {
            console.error("Failed to load blog posts", error);
            toast.error("Could not load blog posts.");
        } finally {
            setLoadingPosts(false);
        }
    }, []);

    useEffect(() => {
        loadBlogPosts();
    }, [loadBlogPosts, refreshTrigger]);

    const handlePostSelect = (post) => {
        setEditingPost(post);
    };

    const handlePostUpdate = async (updatedData) => {
        if (!editingPost) return;

        try {
            await BlogPost.update(editingPost.id, updatedData);
            toast.success(`"${updatedData.title}" has been saved successfully.`);
            setEditingPost(null);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error("Error updating post:", error);
            toast.error("Could not save the article. Please try again.");
        }
    };

    const handlePostDelete = async (post) => {
        try {
            await BlogPost.delete(post.id);
            toast.success(`"${post.title}" has been deleted successfully.`);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error("Error deleting post:", error);
            toast.error("Could not delete the article. Please try again.");
        }
    };

    const handleFileUpload = async (uploadedFiles) => {
        setUploading(true);
        
        for (const file of uploadedFiles) {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            
            if (!['pdf', 'docx', 'doc'].includes(fileExtension)) {
                toast.error(`"${file.name}" is not supported. Please upload PDF or DOCX files only.`);
                continue;
            }

            try {
                toast.info(`Processing "${file.name}"...`);
                
                // Upload file
                const { file_url } = await UploadFile({ file });
                
                // Extract content using AI with file attachment
                const extractedData = await InvokeLLM({
                    prompt: `You are extracting content from an uploaded blog post document. Please extract and return:
1. The title of the blog post
2. The full content of the blog post, formatted as clean HTML (use proper HTML tags like <h1>, <h2>, <p>, <ul>, <li>, etc.)
3. Any SEO keywords that are mentioned or relevant to the content (as a comma-separated string)

Return the data in the exact JSON format specified in the response schema. Make sure the HTML is well-formatted and semantic.`,
                    file_urls: [file_url],
                    response_json_schema: {
                        type: "object",
                        properties: {
                            title: {
                                type: "string",
                                description: "The title of the blog post"
                            },
                            content: {
                                type: "string",
                                description: "The full HTML content of the blog post, with proper formatting"
                            },
                            keywords: {
                                type: "string",
                                description: "Comma-separated SEO keywords mentioned or relevant to the post"
                            }
                        },
                        required: ["title", "content"]
                    }
                });

                if (extractedData && extractedData.title && extractedData.content) {
                    const { title, content, keywords } = extractedData;
                    
                    // Create blog post
                    await BlogPost.create({
                        title: title || file.name.replace(/\.(pdf|docx|doc)$/i, ''),
                        content: content || '',
                        keywords: keywords || '',
                        status: 'Draft',
                        ai_generated: false
                    });
                    
                    toast.success(`"${title}" has been imported successfully!`);
                } else {
                    toast.error(`Failed to extract content from "${file.name}". Please try again.`);
                }
            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
                toast.error(`Failed to import "${file.name}". Please try again.`);
            }
        }
        
        setUploading(false);
        setRefreshTrigger(prev => prev + 1);
    };
    
    return (
        <div className="p-4 sm:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="min-w-0">
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <FileText className="w-8 h-8 text-slate-800" />
                            Blog Post Library
                        </h1>
                        <p className="text-slate-600 mt-1 truncate">
                            Manage all generated and reviewed blog content in one place.
                        </p>
                    </div>
                </div>

                <Card className="bg-white shadow-sm border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="w-5 h-5" />
                            Import Existing Blog Posts
                        </CardTitle>
                        <p className="text-sm text-slate-600 mt-2">
                            Upload PDF or DOCX files to import existing blog content. This helps the AI learn your style, voice, and tone.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <FileUploadZone 
                            onUpload={handleFileUpload} 
                            uploading={uploading}
                            acceptedFileTypes=".pdf,.docx,.doc"
                            helpText="Drag and drop PDF or DOCX files here, or click to browse"
                        />
                    </CardContent>
                </Card>

                <PostList 
                    posts={blogPosts} 
                    isLoading={loadingPosts}
                    onPostSelect={handlePostSelect}
                    onPostDelete={handlePostDelete}
                />
            </div>
            
            {editingPost && (
                <PostEditorModal 
                    post={editingPost}
                    onSave={handlePostUpdate}
                    onClose={() => setEditingPost(null)}
                />
            )}
        </div>
    );
}