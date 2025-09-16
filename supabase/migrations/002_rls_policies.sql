-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deep_dives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_ticker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_stream ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Shows policies (read-only for users, admin can manage)
CREATE POLICY "Shows are viewable by everyone"
  ON public.shows FOR SELECT
  USING (status = 'published');

-- Tracks policies (read-only for users)
CREATE POLICY "Tracks are viewable by everyone"
  ON public.tracks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.shows
    WHERE shows.id = tracks.show_id
    AND shows.status = 'published'
  ));

-- Blog posts policies
CREATE POLICY "Published blog posts are viewable by everyone"
  ON public.blog_posts FOR SELECT
  USING (is_published = true);

CREATE POLICY "Authors can view their own blog posts"
  ON public.blog_posts FOR SELECT
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can insert their own blog posts"
  ON public.blog_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own blog posts"
  ON public.blog_posts FOR UPDATE
  USING (auth.uid() = author_id);

-- Artist profiles policies (read-only for users)
CREATE POLICY "Artist profiles are viewable by everyone"
  ON public.artist_profiles FOR SELECT
  USING (true);

-- Deep dives policies
CREATE POLICY "Published deep dives are viewable by everyone"
  ON public.deep_dives FOR SELECT
  USING (is_published = true);

CREATE POLICY "Authors can view their own deep dives"
  ON public.deep_dives FOR SELECT
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can insert their own deep dives"
  ON public.deep_dives FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own deep dives"
  ON public.deep_dives FOR UPDATE
  USING (auth.uid() = author_id);

-- User favorites policies
CREATE POLICY "Users can view their own favorites"
  ON public.user_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON public.user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON public.user_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Listening history policies
CREATE POLICY "Users can view their own listening history"
  ON public.listening_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own listening history"
  ON public.listening_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listening history"
  ON public.listening_history FOR UPDATE
  USING (auth.uid() = user_id);

-- News ticker policies (read-only for users)
CREATE POLICY "Active news ticker is viewable by everyone"
  ON public.news_ticker FOR SELECT
  USING (is_active = true AND (end_date IS NULL OR end_date > NOW()));

-- Live stream policies (read-only for users)
CREATE POLICY "Live stream status is viewable by everyone"
  ON public.live_stream FOR SELECT
  USING (true);

-- Create a function to check if user is admin (you'll need to set this up in your app)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has admin role in profiles table
  -- You can implement this based on your admin system
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
    AND (email LIKE '%@rhythmlabradio.com' OR email = 'admin@example.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies for content management
CREATE POLICY "Admins can manage shows"
  ON public.shows FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage tracks"
  ON public.tracks FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage artist profiles"
  ON public.artist_profiles FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage news ticker"
  ON public.news_ticker FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage live stream"
  ON public.live_stream FOR ALL
  USING (public.is_admin(auth.uid()));

-- Create a trigger to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();