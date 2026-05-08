/**
 * Loops.so email marketing integration.
 * Syncs contacts for campaigns and segments (e.g. free vs pro users).
 * API key: Settings → API in Loops. Set LOOPS_API_KEY in env.
 * @see https://loops.so/docs/api-reference
 */

const LOOPS_BASE = "https://app.loops.so/api/v1";

function getApiKey(): string | undefined {
  return process.env.LOOPS_API_KEY;
}

export interface LoopsContactProperties {
  email: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  source?: string;
  subscribed?: boolean;
  /** Segment: "free" | "pro" */
  plan?: string;
  /** Onboarding: how they found us */
  referralSource?: string;
  /** Onboarding: free-text detail when source is "other" */
  referralSourceDetail?: string;
  userType?: string;
  role?: string;
  studyIntensity?: string;
  /** Comma-separated or JSON string */
  features?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Update or create a contact in Loops (used for onboarding and subscription sync).
 * Safe to call repeatedly; contact is upserted by email.
 */
export async function updateLoopsContact(
  properties: LoopsContactProperties
): Promise<{ success: true; id: string } | { success: false; message: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("Loops: LOOPS_API_KEY not set, skipping contact sync");
    return { success: false, message: "LOOPS_API_KEY not configured" };
  }

  const { email, ...rest } = properties;
  if (!email?.trim()) {
    return { success: false, message: "Email is required" };
  }

  const body: Record<string, unknown> = {
    email: email.trim(),
    ...rest,
  };

  try {
    const res = await fetch(`${LOOPS_BASE}/contacts/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as { success?: boolean; id?: string; message?: string };

    if (!res.ok) {
      console.error("Loops API error:", res.status, data);
      return {
        success: false,
        message: (data as { message?: string }).message || `HTTP ${res.status}`,
      };
    }

    return { success: true, id: data.id ?? "" };
  } catch (err) {
    console.error("Loops request failed:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Request failed",
    };
  }
}

/**
 * Send an event to Loops (e.g. "onboarding_completed") to trigger automated loops.
 * Optional; use when you have a Loops workflow triggered by this event.
 */
export async function sendLoopsEvent(
  email: string,
  eventName: string,
  eventProperties?: Record<string, string | number | boolean>
): Promise<{ success: boolean; message?: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("Loops: LOOPS_API_KEY not set, skipping event");
    return { success: false, message: "LOOPS_API_KEY not configured" };
  }

  if (!email?.trim()) return { success: false, message: "Email is required" };

  try {
    const res = await fetch(`${LOOPS_BASE}/events/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email: email.trim(),
        eventName,
        eventProperties: eventProperties ?? {},
      }),
    });

    const data = (await res.json()) as { success?: boolean; message?: string };
    if (!res.ok) {
      console.error("Loops send event error:", res.status, data);
      return { success: false, message: (data as { message?: string }).message };
    }
    return { success: true };
  } catch (err) {
    console.error("Loops send event failed:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Request failed",
    };
  }
}
