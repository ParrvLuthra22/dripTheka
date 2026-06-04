"use client";

// UserMenu — shows in the Nav right side.
// Signed-out: "Sign in" button
// Signed-in: small avatar that links to /account

import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (!session) {
    return (
      <Link
        href="/login"
        data-hover
        className="hidden min-[900px]:flex items-center font-mono text-[9px] uppercase tracking-[0.14em] hover:opacity-70 transition-opacity"
      >
        Sign in
      </Link>
    );
  }

  // Signed in — show small avatar
  const user = session.user;
  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <Link
      href="/account"
      data-hover
      aria-label="My account"
      className="hidden min-[900px]:flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      {user?.image ? (
        <Image
          src={user.image}
          alt={user.name ?? ""}
          width={24}
          height={24}
          className="rounded-full border border-[#E4E2DD]/30"
        />
      ) : (
        <span
          className="w-6 h-6 rounded-full bg-[#E4E2DD]/20 border border-[#E4E2DD]/30 flex items-center justify-center font-mono text-[8px] text-[#E4E2DD]"
        >
          {initials}
        </span>
      )}
      <span className="font-mono text-[9px] uppercase tracking-[0.12em]">
        {user?.name?.split(" ")[0] ?? "Account"}
      </span>
    </Link>
  );
}
