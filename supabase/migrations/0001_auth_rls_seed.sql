-- Link app tables to Supabase auth.users, add updated_at triggers,
-- enable Row Level Security, and seed default categories.

-- 1. Foreign keys to auth.users -------------------------------------------------

ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_id_auth_users_id_fk"
  FOREIGN KEY ("id") REFERENCES auth.users("id") ON DELETE CASCADE;

ALTER TABLE "accounts"
  ADD CONSTRAINT "accounts_user_id_auth_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES auth.users("id") ON DELETE CASCADE;

ALTER TABLE "categories"
  ADD CONSTRAINT "categories_user_id_auth_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES auth.users("id") ON DELETE CASCADE;

ALTER TABLE "transactions"
  ADD CONSTRAINT "transactions_user_id_auth_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES auth.users("id") ON DELETE CASCADE;

ALTER TABLE "budgets"
  ADD CONSTRAINT "budgets_user_id_auth_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES auth.users("id") ON DELETE CASCADE;

ALTER TABLE "goals"
  ADD CONSTRAINT "goals_user_id_auth_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES auth.users("id") ON DELETE CASCADE;

ALTER TABLE "goal_contributions"
  ADD CONSTRAINT "goal_contributions_user_id_auth_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES auth.users("id") ON DELETE CASCADE;

-- 2. updated_at trigger ----------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_budgets_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3. Auto-create a profile (and default categories) when a user signs up --------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, currency)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name', 'MYR');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Row Level Security ----------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

-- profiles: a user can read/update only their own row
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- accounts: full CRUD scoped to owner
CREATE POLICY "accounts_select_own" ON accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "accounts_insert_own" ON accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accounts_update_own" ON accounts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accounts_delete_own" ON accounts
  FOR DELETE USING (auth.uid() = user_id);

-- categories: users see default (user_id IS NULL) categories plus their own;
-- they may only insert/update/delete their own custom categories.
CREATE POLICY "categories_select_own_or_default" ON categories
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "categories_insert_own" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_update_own" ON categories
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_delete_own" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- transactions: full CRUD scoped to owner
CREATE POLICY "transactions_select_own" ON transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert_own" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update_own" ON transactions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_delete_own" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- budgets: full CRUD scoped to owner
CREATE POLICY "budgets_select_own" ON budgets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "budgets_insert_own" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_update_own" ON budgets
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_delete_own" ON budgets
  FOR DELETE USING (auth.uid() = user_id);

-- goals: full CRUD scoped to owner
CREATE POLICY "goals_select_own" ON goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "goals_insert_own" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_update_own" ON goals
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_delete_own" ON goals
  FOR DELETE USING (auth.uid() = user_id);

-- goal_contributions: full CRUD scoped to owner
CREATE POLICY "goal_contributions_select_own" ON goal_contributions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "goal_contributions_insert_own" ON goal_contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goal_contributions_update_own" ON goal_contributions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goal_contributions_delete_own" ON goal_contributions
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Default (system) categories --------------------------------------------------

INSERT INTO categories (user_id, name, kind, is_default) VALUES
  (NULL, 'Food', 'expense', true),
  (NULL, 'Transport', 'expense', true),
  (NULL, 'Groceries', 'expense', true),
  (NULL, 'Shopping', 'expense', true),
  (NULL, 'Entertainment', 'expense', true),
  (NULL, 'Bills', 'expense', true),
  (NULL, 'Health', 'expense', true),
  (NULL, 'Education', 'expense', true),
  (NULL, 'Travel', 'expense', true),
  (NULL, 'Subscriptions', 'expense', true),
  (NULL, 'Other', 'expense', true),
  (NULL, 'Salary', 'income', true),
  (NULL, 'Freelance', 'income', true),
  (NULL, 'Allowance', 'income', true),
  (NULL, 'Interest', 'income', true),
  (NULL, 'Other Income', 'income', true);
