/** Re-mounted on every navigation: each page settles in with a short fade/blur. */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
