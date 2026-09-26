-- Clearer header tab names + the "All links" tab. Run once in the Supabase SQL editor; safe to re-run.
-- Only renames items that still have the old default label (your own edits are kept).
update public.navigation_items set label = 'Our work'   where location = 'header' and href = '/projects'    and label = 'Projects';
update public.navigation_items set label = 'Tutorials'  where location = 'header' and href = '/content'     and label = 'Content';
update public.navigation_items set label = 'For brands' where location = 'header' and href = '/sponsorship' and label = 'Sponsorship';
update public.navigation_items set label = 'All links'  where location = 'header' and href = '/links'       and label = 'Links';

insert into public.navigation_items (location, label, href, sort_order)
select 'header'::public.nav_location, 'All links', '/links', 70
where not exists (select 1 from public.navigation_items where location = 'header' and href = '/links');

-- Touch the table so the site refreshes navigation on the next admin save.
update public.navigation_items set updated_at = now() where location = 'header';
