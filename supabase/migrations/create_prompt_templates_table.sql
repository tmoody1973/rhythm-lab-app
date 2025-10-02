-- Create table for storing custom prompt templates
CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type VARCHAR(50) NOT NULL UNIQUE, -- 'artist-profile', 'deep-dive', 'blog-post', 'show-description'
  system_prompt TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on content_type for faster lookups
CREATE INDEX IF NOT EXISTS idx_prompt_templates_content_type
ON prompt_templates(content_type);

-- Add comment for documentation
COMMENT ON TABLE prompt_templates IS 'Stores custom AI prompt templates for content generation';
COMMENT ON COLUMN prompt_templates.content_type IS 'Type of content: artist-profile, deep-dive, blog-post, show-description';
COMMENT ON COLUMN prompt_templates.system_prompt IS 'System/role instruction for the AI';
COMMENT ON COLUMN prompt_templates.user_prompt IS 'User prompt template with ${variable} placeholders';
COMMENT ON COLUMN prompt_templates.notes IS 'Usage notes and guidelines for this prompt template';
