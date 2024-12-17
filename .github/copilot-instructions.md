# Alumni Career & Networking Hub (ACNH) - AI Agent Guide

## Product Context
This is a **professional networking platform** connecting college students with alumni for mentorship, career advice, and job opportunities. See `.github/ACNH_PRD.md` for full product requirements.

**Core user personas:**
- **Students** (current juniors/seniors) seeking internships, jobs, mentorship
- **Alumni** (5+ years out) recruiting, mentoring, giving back to their alma mater

**Key features (P1 MVP):**
- User profiles with skills, endorsements, graduation year, department, role (Student/Alumnus)
- Alumni directory search/filter by graduation year, department, role
- Connection requests (pending → accepted) and direct messaging between connected users
- Job board where alumni post openings; students apply with resume links
- Skill endorsements (alumni validate student skills; endorsements increment per skill)
- Notifications for messages, connection requests, application status changes

## Technical Architecture

### Stack & Structure
- **Frontend:** Vite + React 18 + TypeScript + shadcn-ui + Tailwind CSS (client-only SPA)
- **Routing:** `react-router-dom` configured in `src/App.tsx`
- **State management:** `@tanstack/react-query` (QueryClientProvider at root for server state caching)
- **UI components:** shadcn-ui (Radix UI wrappers) in `src/components/ui/*` + `lucide-react` icons
- **Backend:** Supabase (PostgreSQL database + Auth + Storage + Realtime)
  - Current state: Mock data in pages — integration pending
  - Auth: Supabase Auth for user authentication
  - Storage: Supabase Storage for profile pictures and resumes
  - Realtime: Supabase Realtime for messages and notifications

### Project Layout
```
src/
├── App.tsx              # Routes + global providers (QueryClient, Toaster, Tooltip)
├── main.tsx             # App entry point
├── pages/               # Page-level components (Index, Jobs, Profile, Network, Messages, Settings, NotFound)
├── components/          # Reusable components (Navigation, Hero, JobCard, FilterSidebar, SkillBadge)
│   └── ui/              # shadcn-ui primitives (button, card, input, avatar, badge, etc.)
├── hooks/               # Custom React hooks (use-mobile, use-toast)
└── lib/                 # Utilities (utils.ts with cn helper for className merging)
```

## Quick Start Commands
```bash
npm i                  # Install dependencies
npm run dev            # Start Vite dev server (default: http://localhost:5173)
npm run build          # Production build
npm run build:dev      # Development mode build
npm run preview        # Preview production build
npm run lint           # Run ESLint
```

## Supabase Setup

### Initial Configuration
1. Install Supabase client:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Create `.env.local` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Create `src/lib/supabase.ts`:
   ```tsx
   import { createClient } from '@supabase/supabase-js'
   
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
   
   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
   ```

### Database Setup
Run these SQL commands in Supabase SQL Editor to create tables:
- Execute the 12-table schema (see Database Schema section below)
- Set up Row Level Security (RLS) policies for each table
- Create database functions for: `endorse_skill()`, `send_connection_request()`, `update_application_status()`
- Create triggers for auto-notifications

### Storage Buckets
Create two storage buckets in Supabase Dashboard:
- `avatars` (public) - for profile pictures
- `resumes` (private) - for resume files (use signed URLs)

### Step-by-Step Implementation Checklist

**Phase 1: Supabase Account & Project Setup**
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in project details:
   - Name: `connect-alma-bridge` (or your preferred name)
   - Database Password: (save this securely!)
   - Region: Choose closest to your users
4. Wait 2-3 minutes for project provisioning
5. Once ready, navigate to Settings > API
6. Copy your `Project URL` and `anon public` key

**Phase 2: Frontend Configuration**
1. Install dependencies: `npm install @supabase/supabase-js`
2. Create `.env.local` in project root (this file is gitignored):
   ```env
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```
3. Create `src/lib/supabase.ts` with the client initialization code above
4. Restart your dev server: `npm run dev`

**Phase 3: Database Schema Setup**
1. In Supabase Dashboard, go to SQL Editor
2. Click "New Query"
3. Copy and paste the SQL schema for all 12 tables (see below for complete SQL)
4. Click "Run" to execute
5. Verify tables appear in Table Editor

**Phase 4: Storage Setup**
1. In Supabase Dashboard, go to Storage
2. Create bucket `avatars`:
   - Name: `avatars`
   - Public bucket: ✓ (checked)
   - Click "Create bucket"
3. Create bucket `resumes`:
   - Name: `resumes`
   - Public bucket: ✗ (unchecked - keep private)
   - Click "Create bucket"

**Phase 5: Row Level Security (RLS)**
1. Go to Authentication > Policies
2. Enable RLS on all tables
3. Add policies for each table (examples provided below)

**Phase 6: Test Connection**
1. Create a simple test query in your app:
   ```tsx
   // In any component, add this test
   useEffect(() => {
     const testConnection = async () => {
       const { data, error } = await supabase.from('users').select('count');
       console.log('Supabase connection:', data ? 'SUCCESS' : 'FAILED', error);
     };
     testConnection();
   }, []);
   ```
2. Check browser console for success message

### Complete SQL Schema for Copy-Paste

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

-- Table 9: userskills
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

-- Table 11: groupmembers
CREATE TABLE groupmembers (
  group_id INTEGER REFERENCES groups(group_id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'Member' CHECK (role IN ('Admin', 'Member')),
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Enable Row Level Security on all tables
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

-- Sample RLS Policies (customize based on your needs)
-- Allow public read access to users table (for directory)
CREATE POLICY "Public profiles are viewable by everyone"
  ON users FOR SELECT
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Messages: users can only see their own messages
CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (auth.uid()::text = sender_id::text OR auth.uid()::text = receiver_id::text);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid()::text = sender_id::text);

-- Jobs: everyone can view, only authenticated users can post
CREATE POLICY "Jobs are viewable by everyone"
  ON jobs FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create jobs"
  ON jobs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Insert some sample skills
INSERT INTO skills (skill_name) VALUES
  ('Python'),
  ('JavaScript'),
  ('React'),
  ('Node.js'),
  ('SQL'),
  ('Cloud Computing'),
  ('Machine Learning'),
  ('Data Analysis'),
  ('Project Management'),
  ('Communication');
```

## Key Conventions & Patterns

### Import Paths
- Use `@/` alias for `./src` (configured in `tsconfig.json`)
- Example: `import { Navigation } from "@/components/Navigation";`

### Adding New Routes
1. Create page component in `src/pages/<PageName>.tsx`
2. Add route in `src/App.tsx` **above** the catch-all `*` route:
   ```tsx
   <Route path="/recommendations" element={<Recommendations />} />
   {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
   <Route path="*" element={<NotFound />} />
   ```

### Component Patterns (Copy-Paste Examples)
**Page structure** (see `src/pages/Jobs.tsx`):
```tsx
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";

const NewPage = () => (
  <div className="min-h-screen bg-background">
    <Navigation />
    <Hero />
    <div className="container mx-auto px-4 py-8">
      {/* Page content */}
    </div>
  </div>
);
```

**Search input with icon** (from `Jobs.tsx`):
```tsx
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

<div className="relative">
  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  <Input type="search" placeholder="Search..." className="pl-9" />
</div>
```

**Profile card with avatar** (see `src/pages/Network.tsx`):
```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

<Avatar className="h-16 w-16">
  <AvatarImage src={avatarUrl} />
  <AvatarFallback>{initials}</AvatarFallback>
</Avatar>
<Badge variant="secondary">{graduationYear}</Badge>
```

### Data Fetching (Supabase Integration)

**Current state:** Mock data arrays in page components (e.g., `mockJobs` in `Jobs.tsx`, `connections` in `Network.tsx`)

**When integrating Supabase:**
1. Install Supabase client: `npm install @supabase/supabase-js`
2. Create `src/lib/supabase.ts` with client initialization:
   ```tsx
   import { createClient } from '@supabase/supabase-js'
   
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
   
   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
   ```

3. Use `@tanstack/react-query` with Supabase for all data fetching:

```tsx
// Example: Fetching jobs with filters
const { data: jobs, isLoading, error } = useQuery({
  queryKey: ['jobs', filters],
  queryFn: async () => {
    let query = supabase
      .from('jobs')
      .select('*, posted_by:users(name, profile_pic)')
      .order('created_at', { ascending: false });
    
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  staleTime: 5 * 60 * 1000
});

// Example: Sending a connection request (mutation)
const sendRequest = useMutation({
  mutationFn: async (userId: number) => {
    const { data, error } = await supabase
      .from('connections')
      .insert({
        user_id_1: currentUser.id,
        user_id_2: userId,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['connections'] });
    toast({ title: "Connection request sent!" });
  }
});

// Example: Real-time message subscription
useEffect(() => {
  const channel = supabase
    .channel('messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `receiver_id=eq.${userId}`
    }, (payload) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      // Show notification
    })
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, [userId]);
```

**Supabase Query Patterns:**
```tsx
// Users
const { data } = await supabase.from('users').select('*').eq('role', 'Alumnus');
const { data } = await supabase.from('users').select('*, skills:userskills(skill:skills(*))').eq('user_id', id).single();

// Jobs with joins
const { data } = await supabase
  .from('jobs')
  .select('*, posted_by:users(name, profile_pic), applications(count)')
  .gte('apply_deadline', new Date().toISOString());

// Applications
const { data } = await supabase
  .from('applications')
  .insert({ job_id, applicant_id, resume_link, status: 'Submitted' });

// Connections
const { data } = await supabase
  .from('connections')
  .select('*, user:users!user_id_2(*)')
  .eq('user_id_1', currentUserId)
  .eq('status', 'accepted');

// Messages (with filter for connected users)
const { data } = await supabase
  .from('messages')
  .select('*, sender:users!sender_id(name, profile_pic)')
  .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
  .order('timestamp', { ascending: false });

// Notifications
const { data } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .eq('is_read', false)
  .order('timestamp', { ascending: false });

// Skill endorsements (RPC for increment)
const { data } = await supabase.rpc('endorse_skill', {
  target_user_id: userId,
  target_skill_id: skillId,
  endorser_id: currentUserId
});
```

**Supabase Auth Integration:**
```tsx
// Sign up
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { name, role, department, graduation_year }
  }
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Auth state listener
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // Update user context
  }
});
```

**Supabase Storage for Files:**
```tsx
// Upload resume
const file = event.target.files[0];
const filePath = `resumes/${userId}/${Date.now()}_${file.name}`;
const { data, error } = await supabase.storage
  .from('resumes')
  .upload(filePath, file);

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('resumes')
  .getPublicUrl(filePath);

// Upload profile picture
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.jpg`, file, { upsert: true });
```

### Database Schema (12 Tables)

The backend uses **Supabase (PostgreSQL)** with the following schema. When implementing features, use Supabase's query builder to interact with these tables:

#### 1. Core User & Identity

**users** (Primary entity for Students and Alumni)
```sql
user_id         int4       PRIMARY KEY
name            varchar    
email           varchar    UNIQUE (login credential, managed by Supabase Auth)
password        varchar    (hashed, managed by Supabase Auth)
role            varchar    (professional role/title)
profile_pic     varchar    (Supabase Storage URL)
bio             text       
department      varchar    (e.g., Computer Science)
graduation_year varchar    
```
*Note: Link `users.user_id` to Supabase Auth `auth.users.id` using triggers or RLS policies*

#### 2. Networking & Communication

**connections** (User-to-user relationships)
```sql
connection_id   int4       PRIMARY KEY
user_id_1       int4       FK → users.user_id (initiator)
user_id_2       int4       FK → users.user_id (receiver)
status          varchar    ('pending' | 'accepted' | 'rejected')
```

**messages** (Direct messaging between connected users)
```sql
message_id      int4       PRIMARY KEY
sender_id       int4       FK → users.user_id
receiver_id     int4       FK → users.user_id
message_text    text       
timestamp       timestamp  
```

**notifications** (In-app notifications)
```sql
notification_id int4       PRIMARY KEY
user_id         int4       FK → users.user_id
content         text       (notification message)
is_read         bool       (default: false)
timestamp       timestamp  
```
*Triggered by: new messages, connection requests, application status changes*

#### 3. Career & Job Board

**jobs** (Job postings by alumni)
```sql
job_id          int4       PRIMARY KEY
posted_by       int4       FK → users.user_id (alumni/admin)
title           varchar    
description     text       
location        varchar    
apply_deadline  date       
```

**applications** (Student applications to jobs)
```sql
application_id  int4       PRIMARY KEY
job_id          int4       FK → jobs.job_id
applicant_id    int4       FK → users.user_id (student)
resume_link     varchar    (file URL)
status          varchar    ('Submitted' | 'Reviewed' | 'Interview' | 'Accepted' | 'Rejected')
```

**recommendations** (P2 feature: peer recommendations)
```sql
recommendation_id int4     PRIMARY KEY
recommender_id    int4     FK → users.user_id
recommended_id    int4     FK → users.user_id
text              text     
date              timestamp
```

#### 4. Skills & Community

**skills** (Predefined skill catalog)
```sql
skill_id        int4       PRIMARY KEY
skill_name      varchar    UNIQUE (e.g., 'Python', 'Cloud Computing')
```

**userskills** (Many-to-many: users ↔ skills with endorsements)
```sql
user_id         int4       FK → users.user_id, COMPOSITE PK
skill_id        int4       FK → skills.skill_id, COMPOSITE PK
endorsements_count int4    (incremented when other users endorse)
```

**groups** (P2 feature: professional interest groups)
```sql
group_id        int4       PRIMARY KEY
name            varchar    
description     text       
created_by      int4       FK → users.user_id
```

**groupmembers** (Many-to-many: users ↔ groups)
```sql
group_id        int4       FK → groups.group_id, COMPOSITE PK
user_id         int4       FK → users.user_id, COMPOSITE PK
role            varchar    ('Admin' | 'Member')
```

### Key Relationships & Business Logic

- **Connections are bidirectional:** When `user_id_1` sends a request to `user_id_2`, the connection status starts as 'pending'. Only after acceptance can both users message each other.
- **Skills endorsements:** Any user can endorse another user's skill (stored in `userskills.endorsements_count`). Implement logic to prevent duplicate endorsements from the same user.
- **Job applications:** Only students can apply (`users.role` check). Alumni/admins can post jobs and update application status.
- **Notifications:** Auto-create when: new message arrives, connection request received, application status changes.

**Supabase-Specific Implementation:**
- Use **Row Level Security (RLS)** policies to enforce permissions:
  - Users can only view profiles of connected users or public directory
  - Messages: users can only see messages where they are sender or receiver
  - Applications: students see their own, alumni see applications to their jobs
- Use **Database Functions (RPC)** for complex operations:
  - `endorse_skill(user_id, skill_id)` - increment endorsement with duplicate check
  - `send_connection_request(receiver_id)` - create connection + notification
  - `update_application_status(app_id, new_status)` - update + create notification
- Use **Database Triggers** for automatic actions:
  - After connection accepted: create notification for both users
  - After message insert: create notification for receiver
  - After application status update: create notification for applicant

## Files to Inspect First
- `.github/ACNH_PRD.md` — full product requirements, user stories, success metrics
- `src/App.tsx` — routing and provider setup
- `src/pages/Jobs.tsx` — job board UI with search, filters, job cards (mock data)
- `src/pages/Profile.tsx` — profile page with skills, endorsements, experience sections
- `src/pages/Network.tsx` — alumni directory with connection cards, tabs for connections vs. suggestions
- `src/components/ui/*` — shadcn-ui primitives (button, card, input, avatar, badge, etc.)
- `package.json` — scripts, dependencies

## Development Guidelines

### When Adding Features
1. **Check PRD first:** Verify feature aligns with user stories in `ACNH_PRD.md` (P1 vs P2 priority)
2. **Reuse UI primitives:** Use existing shadcn components in `src/components/ui/*` before creating new ones
3. **Follow naming:** Page components = PascalCase in `src/pages/`, reusable components in `src/components/`
4. **Maintain `@/` imports:** Always use path alias for consistency
5. **Add routes carefully:** Place custom routes above `*` fallback in `src/App.tsx`

### Role-Based UI (Future)
- Authentication not yet implemented
- When added, distinguish Student vs. Alumnus UI:
  - Students: apply to jobs, request connections, receive endorsements
  - Alumni: post jobs, review applications, endorse skills

### Mobile-First Design (NFR)
- All pages must be responsive (Tailwind mobile-first breakpoints: `md:`, `lg:`)
- Test layouts at mobile, tablet, desktop widths

### Performance (NFR)
- Target: <2.5s page load for Profile, Job Board, Directory
- Use react-query caching to minimize network requests
- Lazy-load heavy components if needed

## Verification Steps
1. Run `npm run dev` and spot-check new pages/features
2. Run `npm run lint` before committing
3. Test responsive layouts (mobile, tablet, desktop)
4. Verify new routes work and don't break existing navigation

## Questions for Maintainer
- Supabase project URL and anon key (store in `.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`)
- Should we enable Realtime for all tables or only messages/notifications?
- Email confirmation required for signup, or allow immediate access?
- Storage buckets: should resumes/avatars be public or private (signed URLs)?
- RLS policies: implement on frontend first or set up database policies first?
- Rate limiting: use Supabase rate limiting or implement client-side throttling? 
