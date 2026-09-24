/** FormData → plain object. Repeated keys become arrays; File entries are dropped. */
export function formDataToObject(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(fd.keys())) {
    if (key.startsWith("$ACTION")) continue;
    const values = fd.getAll(key).filter((v): v is string => typeof v === "string");
    out[key] = values.length > 1 || key.endsWith("[]") ? values : (values[0] ?? "");
  }
  for (const key of Object.keys(out)) {
    if (key.endsWith("[]")) {
      out[key.slice(0, -2)] = out[key];
      delete out[key];
    }
  }
  return out;
}
