import { NextResponse } from 'next/server';
import { sb } from '@/src/lib/storyblok';

export async function GET() {
  try {
    // Get the Storyblok API instance
    const storyblokApi = sb();

    // Test basic connection by getting stories (Content Delivery API)
    const response = await storyblokApi.get('cdn/stories', {
      version: 'published',
      per_page: 5
    });

    return NextResponse.json({
      success: true,
      message: 'Storyblok API connection successful',
      stories: response.data.stories.map((story: any) => ({
        name: story.name,
        slug: story.slug,
        content_type: story.content_type,
        created_at: story.created_at
      })),
      total: response.data.stories.length
    });

  } catch (error) {
    console.error('Storyblok API connection failed:', error);

    return NextResponse.json({
      success: false,
      message: 'Storyblok API connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}