import { AdminForm } from "@/components/admin/admin-form";
import { SwitchField, TextAreaField, TextField } from "@/components/admin/fields";
import { Stars, StarRatingInput } from "@/components/portal/star-rating";
import { formatDate } from "@/lib/utils";
import { submitTestimonial } from "@/server/actions/portal";
import { requireClient } from "@/server/auth/client-session";
import { listClientTestimonials } from "@/server/dal/portal";

export const metadata = { title: "Feedback" };

const STATUS: Record<string, string> = { pending: "Waiting for review", approved: "Approved — thank you!", rejected: "Not published" };

export default async function FeedbackPage() {
  const user = await requireClient();
  const mine = await listClientTestimonials(user.clientId);
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        <h1 className="text-[1.75rem] sm:text-[2rem]">How did we do?</h1>
        <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-muted">Your rating helps us improve. If you allow it, we may show your testimonial on our website after review.</p>
        <div className="mt-6">
          <AdminForm action={submitTestimonial} submitLabel="Send feedback" compact>
            <div className="glass-panel grid gap-5 rounded-[1.5rem] p-5 sm:p-7">
              <StarRatingInput />
              <TextAreaField name="quote" label="Your testimonial" rows={6} required placeholder="What did we build, and what changed for your team?" />
              <div className="grid gap-5 sm:grid-cols-3">
                <TextField name="authorName" label="Name" required defaultValue={user.fullName} />
                <TextField name="authorTitle" label="Role / title" />
                <TextField name="company" label="Company" defaultValue={user.companyName} />
              </div>
              <SwitchField name="consentToPublish" label="You may publish this testimonial with my name" hint="Leave off to share feedback privately with the team." />
            </div>
          </AdminForm>
        </div>
      </div>
      <aside>
        <h2 className="label-caps mb-3">Your submissions</h2>
        {mine.length ? (
          <ul className="space-y-3">
            {mine.map((t) => (
              <li key={t.id} className="glass-card rounded-card p-4 text-sm">
                <Stars rating={t.rating} />
                <p className="mt-2 line-clamp-3 text-muted">{t.quote}</p>
                <p className="mt-2 text-xs text-subtle">{formatDate(t.createdAt)} · {t.isPublished ? "Published on the website" : STATUS[t.status]}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Nothing submitted yet.</p>
        )}
      </aside>
    </div>
  );
}
