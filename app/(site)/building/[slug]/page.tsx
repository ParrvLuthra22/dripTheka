import { getBuildingPost, BUILDING_POSTS } from "@/data/building";
import { notFound } from "next/navigation";

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return BUILDING_POSTS.map((p) => ({ slug: p.slug }));
}

export default async function BuildingPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBuildingPost(slug);
  if (!post) notFound();
  return (
    <div className="container-site py-24 max-w-[720px]">
      <h1 className="type-display-md text-[--ink] mb-6">{post.title}</h1>
      <p className="font-mono text-[10px] text-[--ink]/30 uppercase tracking-widest mb-8">{post.date}</p>
      <div className="type-body-lg text-[--ink]/70 whitespace-pre-line">{post.body}</div>
    </div>
  );
}
