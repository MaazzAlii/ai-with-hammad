import { z } from "zod";

/**
 * Zod's JIT feature-detects with `new Function("")`, which our CSP (no
 * 'unsafe-eval') blocks and reports. Jitless mode avoids the probe entirely.
 */
z.config({ jitless: true });
