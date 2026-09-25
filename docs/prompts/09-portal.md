# 09 — Client portal

- **Login** (`/portal/login`): `AuthShell` (single `glass-panel`), brand, "Client portal", email, password, captcha,
  forgot-password mode, footer "Accounts are created by our team… Need access?" (WhatsApp or contact).
- **Shell**: floating glass header (brand mark, segmented nav on ≥ 640 px, WhatsApp ghost, Sign out); on phones the
  segmented control sits in its own glass capsule under the header — no bottom tab bar. "Signed in as …" line.
- **Conversations**: grouped list rows (unread dot, subject, last activity, status badge, chevron), empty state, auto refresh.
- **Thread**: breadcrumb, subject, status badge; iMessage-style bubbles (mine = accent fill, theirs = glass card);
  sticky composer panel; Ctrl/⌘+Enter to send.
- **Feedback**: star rating, testimonial text, name/role/company, consent switch; "Your submissions" with status.
  Phase 2: optional video (upload to private bucket or paste a link) for projects that can't be disclosed publicly.
