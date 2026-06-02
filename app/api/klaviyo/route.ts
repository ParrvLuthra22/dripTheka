import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json() as { email?: string };
  const { email } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const apiKey = process.env.KLAVIYO_PRIVATE_KEY;
  const listId = process.env.KLAVIYO_LIST_ID;

  if (!apiKey || !listId) {
    // Dev: just return success
    console.log(`[Klaviyo dev] Would subscribe: ${email}`);
    return NextResponse.json({ success: true });
  }

  try {
    // Create or update profile
    const profileRes = await fetch("https://a.klaviyo.com/api/profiles/", {
      method: "POST",
      headers: {
        accept: "application/json",
        revision: "2024-10-15",
        "content-type": "application/json",
        Authorization: `Klaviyo-API-Key ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: "profile",
          attributes: { email },
        },
      }),
    });

    const profileData = await profileRes.json() as { data?: { id: string }; errors?: Array<{ meta?: { duplicate_profile_id?: string } }> };
    let profileId: string | undefined = profileData.data?.id;

    // Handle duplicate profile
    if (!profileId && profileData.errors) {
      const dupId = profileData.errors[0]?.meta?.duplicate_profile_id;
      if (dupId) profileId = dupId;
    }

    if (!profileId) {
      return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
    }

    // Subscribe to list
    await fetch(`https://a.klaviyo.com/api/lists/${listId}/relationships/profiles/`, {
      method: "POST",
      headers: {
        accept: "application/json",
        revision: "2024-10-15",
        "content-type": "application/json",
        Authorization: `Klaviyo-API-Key ${apiKey}`,
      },
      body: JSON.stringify({
        data: [{ type: "profile", id: profileId }],
      }),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }
}
