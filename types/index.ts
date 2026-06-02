// Global shared types — domain types live co-located with their data files

export type Brand<T, K extends string> = T & { readonly __brand: K };

export type Paise = Brand<number, "Paise">; // INR in paise (×100)
export type Slug = Brand<string, "Slug">;

export type NavItem = {
  label: string;
  href: string;
  mono?: boolean; // render in JetBrains Mono
};
