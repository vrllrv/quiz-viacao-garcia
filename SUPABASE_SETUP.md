# Supabase Configuration Guide

## 1. Create Supabase Project

- [ ] Go to [supabase.com](https://supabase.com) and create a new project
- [ ] Note down the **Project URL** and **anon/public key**

---

## 2. Database Schema

Run this SQL in Supabase SQL Editor:

```sql
-- Participants table
CREATE TABLE participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  matricula TEXT NOT NULL,
  departamento TEXT,
  total_score INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  answers_count INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Answers table (for detailed analytics)
CREATE TABLE answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  selected_option TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken_ms INTEGER NOT NULL,
  points_earned INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_participants_completed ON participants(completed);
CREATE INDEX idx_participants_score ON participants(total_score DESC);
CREATE INDEX idx_participants_departamento ON participants(departamento);
CREATE INDEX idx_answers_participant ON answers(participant_id);
```

---

## 3. Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Policies for participants
CREATE POLICY "Anyone can insert participants" ON participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read participants" ON participants
  FOR SELECT USING (true);

CREATE POLICY "Participants can update their own record" ON participants
  FOR UPDATE USING (true);

-- Policies for answers
CREATE POLICY "Anyone can insert answers" ON answers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read answers" ON answers
  FOR SELECT USING (true);
```

---

## 4. Enable Realtime (for live leaderboard)

```sql
-- Enable realtime for participants table
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
```

---

## 5. Configure Environment Variables

Create `.env` file in `quiz-platform/` root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 6. Verify Supabase Client

Check that `src/lib/supabase.js` reads the env variables:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
```

---

## 7. Deploy Frontend

### Option A: Vercel (recommended)

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

### Option B: Netlify

1. Push code to GitHub
2. Connect repo to Netlify
3. Add environment variables
4. Deploy

---

## 8. Post-Deploy Testing Checklist

- [ ] Test participant registration (Home page)
- [ ] Test quiz flow (all questions, scoring)
- [ ] Test leaderboard updates in realtime
- [ ] Test admin panel access (`/admin`)
- [ ] Test different departments filter on leaderboard

---

## Optional: Admin Protection

For production, consider adding authentication to `/admin` route:

```sql
-- Create admin users table
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add your admin email
INSERT INTO admin_users (email) VALUES ('your-email@example.com');
```

Then implement Supabase Auth in the Admin page.

---

## Troubleshooting

### "supabase is null"
- Check that `.env` file exists and has correct values
- Restart dev server after adding `.env`

### RLS blocking requests
- Check policies are created correctly
- Temporarily disable RLS for debugging: `ALTER TABLE participants DISABLE ROW LEVEL SECURITY;`

### Realtime not working
- Verify table is added to publication
- Check Supabase dashboard > Database > Replication
