// Klaviyo API helpers — server-side only
const BASE = "https://a.klaviyo.com/api";
const REV = "2024-10-15";

function headers() {
  return {
    accept: "application/json",
    revision: REV,
    "content-type": "application/json",
    Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_PRIVATE_KEY}`,
  };
}

/** Subscribe email to the Regulars list. Returns profile id. */
export async function subscribeToList(email: string): Promise<string> {
  const key = process.env.KLAVIYO_PRIVATE_KEY;
  const listId = process.env.KLAVIYO_LIST_ID;

  if (!key || !listId) {
    console.log(`[klaviyo:dev] subscribe ${email}`);
    return "dev_profile_id";
  }

  // Upsert profile
  const pRes = await fetch(`${BASE}/profiles/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ data: { type: "profile", attributes: { email } } }),
  });

  type ProfileResponse = {
    data?: { id: string };
    errors?: Array<{ meta?: { duplicate_profile_id?: string } }>;
  };
  const pData = (await pRes.json()) as ProfileResponse;
  const profileId =
    pData.data?.id ?? pData.errors?.[0]?.meta?.duplicate_profile_id;

  if (!profileId) throw new Error("Failed to upsert Klaviyo profile");

  // Add to list
  await fetch(`${BASE}/lists/${listId}/relationships/profiles/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ data: [{ type: "profile", id: profileId }] }),
  });

  return profileId;
}
