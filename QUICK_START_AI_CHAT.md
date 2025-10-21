# 🚀 Quick Start: Music Discovery AI Chat

## ✅ Feature #1 is Built and Ready!

Everything is set up. You just need to add your Thesys API key and test it out.

---

## Step 1: Get Your Thesys API Key (5 minutes)

1. **Go to** [https://thesys.dev](https://thesys.dev)
2. **Click** "Sign Up" (or "Sign In" if you have an account)
3. **Navigate to** API Keys section
4. **Generate** a new API key
5. **Copy** the key

---

## Step 2: Add API Key to Environment (1 minute)

Open your `.env.local` file and add:

```bash
# Thesys C1 AI Chat
THESYS_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

Replace `sk-xxxxxxxxxxxxxxxxxxxxxxxx` with your actual API key.

---

## Step 3: Start the Dev Server (1 minute)

```bash
npm run dev
```

Wait for it to start (usually ~5 seconds).

---

## Step 4: Test the AI Chat (2 minutes)

1. **Open** [http://localhost:3000/ai-chat](http://localhost:3000/ai-chat)

2. **Try these prompts:**
   ```
   Find me some chill electronic music
   ```
   ```
   Show me jazz artists similar to Kamasi Washington
   ```
   ```
   What's good for studying?
   ```
   ```
   Discover experimental ambient artists
   ```

3. **Watch the magic!**
   - The AI will call your Storyblok API
   - Search for matching artists
   - Generate interactive UI responses
   - Stream them back to you in real-time

---

## What You're Testing

### ✅ Working Features:
- Natural language music discovery
- Genre-based artist search
- Mood-based filtering ("chill", "energetic", etc.)
- Artist name search
- Similar artist recommendations
- Real-time streaming responses
- Interactive chat interface

### 🔜 Coming Soon (Features #2-5):
- Artist Deep Dive Explorer
- Event & Show Finder
- Smart Album Explorer
- Playlist Generator
- Artist Connection Graph

---

## Troubleshooting

### "Failed to get response" or 401 Error
**Problem:** API key not set or invalid
**Solution:**
- Double-check your API key in `.env.local`
- Make sure there are no extra spaces
- Restart the dev server after adding the key

### "No artists found"
**Problem:** No matching artists in Storyblok
**Solution:**
- Make sure you have artist profiles in `profiles/` folder in Storyblok
- Verify artists have genre tags
- Try broader searches like "Find me some music"

### Chat UI doesn't load
**Problem:** Build error or missing dependencies
**Solution:**
```bash
npm install
npm run dev
```

### Streaming stops/freezes
**Problem:** Edge runtime issue
**Solution:**
- Clear your browser cache
- Try a different browser
- Check the browser console for errors

---

## Understanding the Costs

**Thesys C1 Pricing:**
- Pay-per-use (similar to OpenAI)
- Approximately **$0.10-0.50 per 100 messages**
- For testing: ~$5-10 should last you weeks

**During Development:**
- Use small limits (6 artists per query)
- Test with specific queries
- Estimated cost: $1-2/day of active testing

**In Production (1000 users/month):**
- Estimated: $50-150/month
- Scales with usage
- Much cheaper than building UI generation yourself

---

## Next Steps

### After Testing Locally:

1. **✅ Verify it works** - Test 5-10 different queries
2. **📝 Take notes** - What works well? What's confusing?
3. **🎨 Customize** - Update colors, prompts, suggested questions
4. **📊 Add analytics** - Track what users ask about
5. **🚀 Deploy** - Push to Vercel/production

### Want to Build More?

**Feature #2: Artist Deep Dive Explorer**
- Interactive artist profile exploration
- Timeline visualization
- Influence mapping
- Est. build time: 1-2 weeks

**Feature #8: Event Finder**
- Ticketmaster integration
- Web search for venue info
- Interactive event cards
- Est. build time: 1-2 weeks

See `THESYS_C1_DEVELOPMENT_JOURNAL.md` for complete plans.

---

## Success Checklist

Before moving to production:

- [ ] Thesys API key added to `.env.local`
- [ ] Dev server starts without errors
- [ ] AI chat loads at `/ai-chat`
- [ ] Can send messages and get responses
- [ ] Artist search returns results
- [ ] Responses stream in real-time
- [ ] UI looks good on mobile
- [ ] Error handling works (try invalid queries)
- [ ] Performance is acceptable (< 3 sec responses)

---

## Support

**Thesys Issues:**
- Docs: https://docs.thesys.dev
- Discord: https://discord.gg/thesys
- Email: support@thesys.dev

**Your Code Issues:**
- Check `AI_CHAT_README.md`
- Review `THESYS_C1_DEVELOPMENT_JOURNAL.md`
- Inspect browser console for errors
- Check Next.js server logs

---

**🎉 Congratulations!**

You've built an AI-powered music discovery chat that combines:
- Thesys C1's generative UI
- Your Storyblok artist catalog
- Real-time streaming
- Natural language understanding

**Time to test:** Go to [http://localhost:3000/ai-chat](http://localhost:3000/ai-chat) and start discovering music!
