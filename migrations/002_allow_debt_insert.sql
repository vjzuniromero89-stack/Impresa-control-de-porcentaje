drop policy if exists "public_insert_debts" on public.debts;
create policy "public_insert_debts"
on public.debts
for insert
to anon, authenticated
with check (true);
