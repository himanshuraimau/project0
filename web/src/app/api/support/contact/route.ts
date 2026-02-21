import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const SUBJECT_MIN_LENGTH = 3;
const SUBJECT_MAX_LENGTH = 120;
const MESSAGE_MIN_LENGTH = 10;
const MESSAGE_MAX_LENGTH = 2000;
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

interface ContactRequestBody {
  subject?: unknown;
  message?: unknown;
}

interface Web3FormsResponse {
  success?: boolean;
  message?: string;
}

function validatePayload(subject: string, message: string): string | null {
  if (subject.length < SUBJECT_MIN_LENGTH) {
    return `Subject must be at least ${SUBJECT_MIN_LENGTH} characters.`;
  }

  if (subject.length > SUBJECT_MAX_LENGTH) {
    return `Subject must be less than ${SUBJECT_MAX_LENGTH + 1} characters.`;
  }

  if (message.length < MESSAGE_MIN_LENGTH) {
    return `Message must be at least ${MESSAGE_MIN_LENGTH} characters.`;
  }

  if (message.length > MESSAGE_MAX_LENGTH) {
    return `Message must be less than ${MESSAGE_MAX_LENGTH + 1} characters.`;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as ContactRequestBody;
    const subject =
      typeof body.subject === "string" ? body.subject.trim() : "";
    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    const validationError = validatePayload(subject, message);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
    if (!accessKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Support form is not configured. Add WEB3FORMS_ACCESS_KEY.",
        },
        { status: 503 }
      );
    }

    const userName = session.user.name?.trim() || "Flinote user";
    const userEmail = session.user.email?.trim() || "unknown@flinote.ai";
    const formattedMessage = [
      message,
      "",
      "---",
      `User ID: ${session.user.id}`,
      `Name: ${userName}`,
      `Email: ${userEmail}`,
      "Source: Web settings contact support form",
    ].join("\n");

    const providerResponse = await fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `[Flinote Support] ${subject}`,
        from_name: userName,
        email: userEmail,
        replyto: userEmail,
        message: formattedMessage,
        botcheck: "",
      }),
    });

    const providerData = (await providerResponse
      .json()
      .catch(() => null)) as Web3FormsResponse | null;

    if (!providerResponse.ok || !providerData?.success) {
      console.error("Web3Forms contact error:", {
        status: providerResponse.status,
        message: providerData?.message,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Unable to send your message right now. Please try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Support contact API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unexpected error while sending support message.",
      },
      { status: 500 }
    );
  }
}
