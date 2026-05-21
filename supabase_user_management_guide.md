# 🛠️ Supabase User Management & Login History Guide

This guide walks you through the step-by-step setup to manage user accounts in **Supabase Auth** and create database-backed audit tables that record every time an administrator logs in.

---

## 1️⃣ How Supabase Auth Stores User Accounts
Supabase handles user logins via its built-in authentication system. All user accounts, emails, and passwords are encrypted and stored in a secure internal database schema called `auth.users`. 

### How to Create Admin Accounts in the Supabase Dashboard:
1. Open your **Supabase Project Dashboard** (https://supabase.com).
2. On the left-side navigation panel, click the **Authentication** (Key icon) tab.
3. Select **Users** from the menu.
4. Click the **Add User** dropdown button on the top right, and choose **Create User**.
5. Input the administrator's **Email** and **Password** (e.g., `bryan.figaro@hi-techfuelautomate.com`), toggle "Auto Confirm User" to `ON`, and click **Create User**.
6. The user is now securely stored in your database and is ready to sign in immediately using your new technical portal!

---

## 2️⃣ Database Setup: Login Audit History Table
To keep a record of all administrator sign-ins, run the following SQL query in your Supabase dashboard. This creates a public `login_history` table that securely records user emails and timestamps:

```sql
-- 1. Create a secure login history table
create table public.login_history (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users on delete cascade,
  email       text not null,
  login_time  timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable secure Row-Level Security (RLS)
alter table public.login_history enable row level security;

-- 3. Create a policy allowing authenticated users to view logs
create policy "Allow authenticated users to read audit logs"
  on public.login_history for select
  using (auth.role() = 'authenticated');

-- 4. Create a policy allowing the application's login form to insert logs
create policy "Allow anonymous system log inserts"
  on public.login_history for insert
  with check (true);
```

### How to Run this SQL in Supabase:
1. Go to your **Supabase Dashboard**.
2. Click on the **SQL Editor** tab (Terminal `>_` icon) on the left sidebar.
3. Click **New Query**.
4. Paste the SQL query block above into the editor.
5. Click the green **Run** button on the bottom right.

---

## 3️⃣ Optional: Automatic Public Profiles Sync
If you want a public record of all registered users to reference in query dropdowns or logs, you can set up an automatic PostgreSQL trigger. This trigger automatically syncs any newly created account in `auth.users` to a public `profiles` table:

```sql
-- 1. Create a public profiles table linking to auth.users
create table public.profiles (
  id         uuid references auth.users on delete cascade primary key,
  email      text not null,
  role       text default 'admin'::text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row-Level Security
alter table public.profiles enable row level security;

-- Allow all authenticated users to read profiles
create policy "Allow read access for profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- 2. Create the sync trigger function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'admin');
  return new;
end;
$$ language plpgsql security definer;

-- 3. Bind the trigger to fire whenever a new user is created in auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 4️⃣ How the Application Connects to the Database Log
In the technical intervention report app:
* **AdminLogin.jsx** uses `supabase.auth.signInWithPassword` to securely check credentials against the secure internal database.
* Upon a successful login, **AdminLogin.jsx** immediately fires a secure insertion query directly to the `login_history` test:
  ```javascript
  await supabase.from('login_history').insert({
    user_id: data.user.id,
    email: data.user.email
  });
  ```
* This guarantees that every sign-in is tracked with the email and precise UTC timestamp.
* **Offline Sandbox Resilience**: If the database is offline or unconfigured, the app falls back to local storage and alerts in the console log: `Audit sign-in history table offline or not created yet`, ensuring the user's interface remains functional!
