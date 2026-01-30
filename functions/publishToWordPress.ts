import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { blog_post_id } = await req.json();

        if (!blog_post_id) {
            return Response.json({ error: 'blog_post_id is required' }, { status: 400 });
        }

        // Get the blog post from the database
        const blogPost = await base44.entities.BlogPost.get(blog_post_id);

        if (!blogPost) {
            return Response.json({ error: 'Blog post not found' }, { status: 404 });
        }

        // Get WordPress credentials from environment
        const wpSiteUrl = Deno.env.get("WORDPRESS_SITE_URL");
        const wpUsername = Deno.env.get("WORDPRESS_USERNAME");
        const wpAppPassword = Deno.env.get("WORDPRESS_APP_PASSWORD");

        if (!wpSiteUrl || !wpUsername || !wpAppPassword) {
            return Response.json({ 
                error: 'WordPress credentials not configured. Please contact your administrator.' 
            }, { status: 500 });
        }

        // Remove spaces from application password
        const cleanPassword = wpAppPassword.replace(/\s/g, '');

        // Prepare WordPress post data
        const wpPostData = {
            title: blogPost.title,
            content: blogPost.content,
            status: blogPost.status === 'Published' ? 'publish' : 'draft',
            excerpt: blogPost.meta_description || '',
        };

        // Add featured image if available
        if (blogPost.featured_image_url) {
            // Note: This would require uploading the image first and getting its media ID
            // For now, we'll skip this and just publish the content
        }

        // Add categories/tags if keywords are provided
        if (blogPost.keywords) {
            // WordPress would need category/tag IDs, but we can try using tags by name
            const tags = blogPost.keywords.split(',').map(k => k.trim());
            // Note: This is a simplified approach - in production you'd want to 
            // fetch or create tag IDs first
        }

        // Create Basic Auth header
        const authString = btoa(`${wpUsername}:${cleanPassword}`);
        
        // Make request to WordPress REST API
        const wpResponse = await fetch(`${wpSiteUrl}/wp-json/wp/v2/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authString}`,
            },
            body: JSON.stringify(wpPostData),
        });

        if (!wpResponse.ok) {
            const errorText = await wpResponse.text();
            console.error('WordPress API Error:', errorText);
            return Response.json({ 
                error: 'Failed to publish to WordPress',
                details: errorText,
                status: wpResponse.status
            }, { status: 500 });
        }

        const wpPost = await wpResponse.json();

        // Update the blog post in our database with WordPress URL and ID, and mark it as published
        await base44.asServiceRole.entities.BlogPost.update(blog_post_id, {
            status: 'Published',
            wordpress_url: wpPost.link,
            wordpress_id: wpPost.id,
        });

        return Response.json({
            success: true,
            message: 'Blog post published to WordPress successfully!',
            wordpress_url: wpPost.link,
            wordpress_id: wpPost.id,
        });

    } catch (error) {
        console.error('Error publishing to WordPress:', error);
        return Response.json({ 
            error: error.message || 'An unexpected error occurred',
            details: error.toString()
        }, { status: 500 });
    }
});