-- Adds "Links" (/links) to the header navigation. Run once in the Supabase SQL editor; safe to re-run.
insert into public.navigation_items (location, label, href, sort_order)
select 'header'::public.nav_location, 'Links', '/links', 70
where not exists (select 1 from public.navigation_items where location = 'header' and href = '/links');
