"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { sampleTeiXml } from "@/lib/sampleXml";
import AuthButton from "@/components/AuthButton";

// Dynamically import to avoid SSR issues
const LeafWriterEditor = dynamic(
  () => import("@/components/LeafWriterEditor"),
  { ssr: false }
);

function EditorWithParams() {
  const searchParams = useSearchParams();

  // Read GitHub file parameters from URL
  const githubParams = {
    owner: searchParams.get("owner"),
    repo: searchParams.get("repo"),
    branch: searchParams.get("branch"),
    path: searchParams.get("path"),
    filename: searchParams.get("filename"),
  };

  // Check if we have valid GitHub parameters
  const hasGithubParams = githubParams.owner && githubParams.repo && githubParams.filename;

  return (
    <LeafWriterEditor
      initialXml={sampleTeiXml}
      user={{
        name: "Demo User",
        uri: "https://example.com/users/demo",
      }}
      githubParams={hasGithubParams ? {
        owner: githubParams.owner!,
        repo: githubParams.repo!,
        branch: githubParams.branch || "main",
        path: githubParams.path || "",
        filename: githubParams.filename!,
      } : undefined}
    />
  );
}

export default function EditPage() {
  return (
    <div className="h-screen flex flex-col">
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-300 hover:text-white">
            ← Back
          </Link>
          <h1 className="text-xl font-bold">LEAF-Writer</h1>
        </div>
        <AuthButton />
      </header>
      <main className="flex-1">
        <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
          <EditorWithParams />
        </Suspense>
      </main>
    </div>
  );
}
