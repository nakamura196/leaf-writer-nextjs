"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { sampleTeiXml } from "@/lib/sampleXml";
import AuthButton from "@/components/AuthButton";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

// Dynamically import to avoid SSR issues
const LeafWriterEditor = dynamic(
  () => import("@/components/LeafWriterEditor"),
  { ssr: false }
);

function EditorWithParams() {
  const searchParams = useSearchParams();
  const t = useTranslations("editor");

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

function LoadingFallback() {
  const t = useTranslations("editor");
  return (
    <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-400">
      {t("loading")}
    </div>
  );
}

export default function EditPage() {
  const t = useTranslations("editor");
  const tHome = useTranslations("home");

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-gray-800 dark:bg-gray-950 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-300 hover:text-white">
            ← {t("back")}
          </Link>
          <h1 className="text-xl font-bold">{tHome("title")}</h1>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeSwitcher />
          <AuthButton />
        </div>
      </header>
      <main className="flex-1 bg-white dark:bg-gray-900">
        <Suspense fallback={<LoadingFallback />}>
          <EditorWithParams />
        </Suspense>
      </main>
    </div>
  );
}
