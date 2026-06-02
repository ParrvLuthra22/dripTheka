import { BUILDING_POSTS } from "@/data/building";
import Link from "next/link";

export default function BuildingIndexPage() {
  return (
    <div className="container-site py-24 space-y-8">
      <h1 className="type-display-md text-[--ink]">Building</h1>
      {BUILDING_POSTS.map((post) => (
        <Link key={post.slug} href={`/building/${post.slug}`} className="block group">
          <h2 className="type-display-md text-[--ink] group-hover:text-[--blue] transition-colors">{post.title}</h2>
          <p className="type-body-md text-[--ink]/50 mt-1">{post.excerpt}</p>
        </Link>
      ))}
    </div>
  );
}
