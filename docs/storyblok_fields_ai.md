Required Storyblok Content Types & Fields

  1. artist_profile Content Type

  Required Fields:
  - title (Text) - Artist name/profile title
  - subtitle (Text) - Brief tagline or subtitle
  - content (Richtext) - Main profile content
  - tags (Text, Multiple values) - Content tags for categorization
  - category (Text) - Content category ("Artist Profiles")
  - published_at (Datetime) - Generation timestamp
  - author (Text) - Content author ("AI Content Generator")

  SEO Fields:
  - seo_title (Text) - SEO-optimized title (50-60 chars)
  - meta_description (Textarea) - SEO meta description (150-160 chars)

  Optional Enhancement Fields:
  - featured_image (Asset) - Artist photo/artwork
  - genre (Text) - Primary music genre
  - website (Text/Link) - Artist website
  - social_links (Text, Multiple) - Social media links

  2. deep_dive Content Type

  Required Fields:
  - title (Text) - Deep dive title
  - subtitle (Text) - Subtitle or focus area
  - content (Richtext) - Main analytical content
  - tags (Text, Multiple values) - Content tags
  - category (Text) - Content category ("Deep Dives")
  - published_at (Datetime) - Generation timestamp
  - author (Text) - Content author
  - audio_file (Asset) - Critical for podcast integration

  SEO Fields:
  - seo_title (Text) - SEO-optimized title
  - meta_description (Textarea) - SEO meta description

  Optional Enhancement Fields:
  - featured_image (Asset) - Header image
  - estimated_read_time (Number) - Reading time estimate
  - difficulty_level (Options: Beginner/Intermediate/Advanced)
  - related_artists (Text, Multiple) - Referenced artists

  3. blog_post Content Type

  Required Fields:
  - title (Text) - Blog post title
  - subtitle (Text) - Post subtitle
  - content (Richtext) - Main blog content
  - tags (Text, Multiple values) - Content tags
  - category (Text) - Content category ("Blog Posts")
  - published_at (Datetime) - Generation timestamp
  - author (Text) - Content author

  SEO Fields:
  - seo_title (Text) - SEO-optimized title
  - meta_description (Textarea) - SEO meta description

  Optional Enhancement Fields:
  - featured_image (Asset) - Blog header image
  - excerpt (Textarea) - Short excerpt for previews
  - reading_time (Number) - Estimated reading time

  Global Meta Data Settings

  For all content types, ensure these meta data fields are configured in Storyblok:

  SEO Tab Fields:

  - title (Text) - Page title tag
  - description (Textarea) - Meta description
  - og_image (Asset) - Open Graph image
  - og_title (Text) - Open Graph title
  - og_description (Textarea) - Open Graph description
  - twitter_image (Asset) - Twitter card image
  - twitter_title (Text) - Twitter card title
  - twitter_description (Textarea) - Twitter card description

  Folder Structure Configuration

  Make sure these folder IDs are correctly set in your environment:

  # These should match your actual Storyblok folder IDs
  STORYBLOK_PROFILES_FOLDER_ID=1001    # Artist profiles folder
  STORYBLOK_DEEP_DIVES_FOLDER_ID=1002  # Deep dives folder  
  STORYBLOK_BLOG_FOLDER_ID=1003        # Blog posts folder

  Critical Notes:

  1. Audio File Field: The audio_file field in deep_dive content type is essential for podcast integration
  2. Richtext Configuration: Ensure richtext fields support headings (h1-h6) and paragraphs
  3. Multiple Values: Tags field must allow multiple values
  4. Asset Fields: Configure asset fields to accept appropriate file types (images, audio)
  5. SEO Fields: All SEO fields should have character limits matching the implementation (60 chars for titles, 160
   for descriptions)