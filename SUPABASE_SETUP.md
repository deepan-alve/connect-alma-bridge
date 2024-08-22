# Supabase Setup Guide for ACNH

This guide will help you connect your Alumni Career & Networking Hub to Supabase in **under 30 minutes**.

## 📋 Prerequisites
- Node.js and npm installed
- A GitHub account (for Supabase signup)
- This project cloned locally

## 🚀 Quick Start (Step-by-Step)

### Step 1: Create Supabase Project (5 minutes)

1. **Go to Supabase:**
   - Visit [supabase.com](https://supabase.com)
   - Click "Start your project" or "Sign In"
   - Sign in with GitHub

2. **Create New Project:**
   - Click "New Project"
   - Choose your organization (or create one)
   - Fill in project details:
     ```
     Name: connect-alma-bridge
     Database Password: [Choose a strong password and SAVE IT!]
     Region: [Choose closest to you, e.g., "East US" or "Southeast Asia"]
     ```
   - Click "Create new project"
   - ⏰ Wait 2-3 minutes for provisioning

3. **Get Your API Credentials:**
   - Once project is ready, click on "Settings" (gear icon) in left sidebar
   - Go to "API" section
   - Copy these two values:
     - **Project URL** (looks like: `https://xxxxx.supabase.co`)
     - **anon public** key (under "Project API keys")

### Step 2: Configure Your Frontend (2 minutes)

1. **Install Supabase Client:**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Create Environment File:**
   - In your project root, create a file named `.env.local`
   - Add your credentials (replace with actual values):
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```
   - ⚠️ **Important:** `.env.local` should already be in `.gitignore` - never commit this file!

3. **Create Supabase Client:**
   - Create file `src/lib/supabase.ts`:
   ```typescript
   import { createClient } from '@supabase/supabase-js'

   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

   if (!supabaseUrl || !supabaseAnonKey) {
     throw new Error('Missing Supabase environment variables')
   }

   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
   ```

4. **Restart Dev Server:**
   ```bash
   npm run dev
   ```

### Step 3: Create Database Tables (5 minutes)

1. **Open SQL Editor:**
   - In Supabase Dashboard, click "SQL Editor" in left sidebar
   - Click "New Query"

2. **Copy and Paste This SQL:**
   - Copy the entire SQL schema from below
   - Paste into the SQL editor
   - Click "Run" (or press Ctrl+Enter)

3. **Verify Tables:**
   - Click "Table Editor" in left sidebar
   - You should see 11 tables: users, connections, messages, notifications, jobs, applications, recommendations, skills, userskills, groups, groupmembers

**Complete SQL Schema:**
```sql
-- Table 1: users
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  profile_pic VARCHAR(500),
  bio TEXT,
  department VARCHAR(100),
  graduation_year VARCHAR(4)
);

-- Table 2: connections
CREATE TABLE connections (
  connection_id SERIAL PRIMARY KEY,
  user_id_1 INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  user_id_2 INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table 3: messages
CREATE TABLE messages (
  message_id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Table 4: notifications
CREATE TABLE notifications (
  notification_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Table 5: jobs
CREATE TABLE jobs (
  job_id SERIAL PRIMARY KEY,
  posted_by INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  apply_deadline DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table 6: applications
CREATE TABLE applications (
  application_id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(job_id) ON DELETE CASCADE,
  applicant_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  resume_link VARCHAR(500),
  status VARCHAR(20) DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Reviewed', 'Interview', 'Accepted', 'Rejected')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table 7: recommendations
CREATE TABLE recommendations (
  recommendation_id SERIAL PRIMARY KEY,
  recommender_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  recommended_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  date TIMESTAMP DEFAULT NOW()
);

-- Table 8: skills
CREATE TABLE skills (
  skill_id SERIAL PRIMARY KEY,
  skill_name VARCHAR(100) UNIQUE NOT NULL
);

-- Table 9: userskills (many-to-many: users + skills)
CREATE TABLE userskills (
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  skill_id INTEGER REFERENCES skills(skill_id) ON DELETE CASCADE,
  endorsements_count INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, skill_id)
);

-- Table 10: groups
CREATE TABLE groups (
  group_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table 11: groupmembers (many-to-many: groups + users)
CREATE TABLE groupmembers (
  group_id INTEGER REFERENCES groups(group_id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'Member' CHECK (role IN ('Admin', 'Member')),
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE userskills ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE groupmembers ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (you can customize these later)

-- Users: Public profiles viewable, users can update own profile
CREATE POLICY "Public profiles viewable" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Messages: Users see only their own messages
CREATE POLICY "Users view own messages" ON messages
  FOR SELECT USING (auth.uid()::text = sender_id::text OR auth.uid()::text = receiver_id::text);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid()::text = sender_id::text);

-- Jobs: Public viewing, authenticated posting
CREATE POLICY "Jobs viewable by all" ON jobs
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users post jobs" ON jobs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Notifications: Users see only their own
CREATE POLICY "Users view own notifications" ON notifications
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Skills: Public viewing
CREATE POLICY "Skills viewable by all" ON skills
  FOR SELECT USING (true);

-- Insert sample skills
INSERT INTO skills (skill_name) VALUES
  ('Python'),
  ('JavaScript'),
  ('React'),
  ('Node.js'),
  ('TypeScript'),
  ('SQL'),
  ('PostgreSQL'),
  ('Cloud Computing'),
  ('AWS'),
  ('Machine Learning'),
  ('Data Analysis'),
  ('Project Management'),
  ('Communication'),
  ('Leadership'),
  ('Problem Solving');
```

### Step 4: Create Storage Buckets (3 minutes)

1. **Go to Storage:**
   - In Supabase Dashboard, click "Storage" in left sidebar
   - Click "Create a new bucket"

2. **Create Avatars Bucket:**
   ```
   Name: avatars
   Public bucket: ✓ (checked)
   ```
   - Click "Create bucket"

3. **Create Resumes Bucket:**
   ```
   Name: resumes
   Public bucket: ✗ (unchecked - keep private for security)
   ```
   - Click "Create bucket"

4. **Set Storage Policies:**
   - Click on "avatars" bucket
   - Go to "Policies" tab
   - Click "New Policy" → "For full customization"
   - Add policies for INSERT and SELECT (allow authenticated users)

### Step 5: Test Your Connection (2 minutes)

1. **Create a Test Component:**
   - Open `src/pages/Index.tsx`
   - Add this at the top of the component (after imports):
   ```tsx
   import { supabase } from "@/lib/supabase";
   import { useEffect } from "react";

   // Inside the Index component, add:
   useEffect(() => {
     const testConnection = async () => {
       const { data, error } = await supabase.from('skills').select('*');
       console.log('Supabase connection test:');
       console.log('Skills data:', data);
       console.log('Error:', error);
       if (data) {
         console.log('✅ SUCCESS - Supabase connected!');
       } else {
         console.log('❌ FAILED - Check your credentials');
       }
     };
     testConnection();
   }, []);
   ```

2. **Check Browser Console:**
   - Open your app: `http://localhost:5173`
   - Press F12 to open Developer Tools
   - Go to "Console" tab
   - You should see: `✅ SUCCESS - Supabase connected!` and a list of skills

## 🎉 You're Done!

Your Supabase backend is now connected! Here's what you have:

✅ Supabase project created  
✅ 11 database tables with proper relationships  
✅ Row Level Security (RLS) enabled  
✅ Storage buckets for avatars and resumes  
✅ Frontend configured with environment variables  
✅ Connection tested successfully  

## 🔄 Next Steps

Now you can start replacing mock data with real Supabase queries:

### Example: Fetch Real Jobs
Replace the `mockJobs` in `src/pages/Jobs.tsx`:

```tsx
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Replace mockJobs array with:
const { data: jobs, isLoading } = useQuery({
  queryKey: ['jobs'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*, posted_by:users(name, profile_pic)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
});

// Then use: {jobs?.map(job => <JobCard key={job.job_id} {...job} />)}
```

### Example: User Signup
```tsx
const handleSignup = async (email, password, name, role) => {
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;

  // 2. Create profile in users table
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      user_id: authData.user.id,
      name,
      email,
      role,
    });

  if (profileError) throw profileError;
};
```

## 🐛 Troubleshooting

**Problem:** "Missing Supabase environment variables" error  
**Solution:** Make sure `.env.local` exists and has correct format. Restart dev server.

**Problem:** Can't see any data in tables  
**Solution:** Check RLS policies - you might need to temporarily disable RLS for testing.

**Problem:** 401 Unauthorized errors  
**Solution:** Check that your anon key is correct in `.env.local`.

**Problem:** Tables not created  
**Solution:** Check SQL Editor for error messages. Run each CREATE TABLE statement individually.

## 📚 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)

## 💡 Tips

1. **Use Supabase Dashboard Table Editor** for adding test data manually
2. **Enable email confirmation** in Authentication > Providers > Email for production
3. **Set up database backups** in Settings > Database
4. **Monitor usage** in Settings > Usage to stay within free tier limits
5. **Use Supabase CLI** for advanced database migrations: `npx supabase init`

Need help? Check the [GitHub Issues](https://github.com/Dhakshi03/connect-alma-bridge/issues) or Supabase Discord!
