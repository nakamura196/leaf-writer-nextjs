"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import AuthButton from "@/components/AuthButton";
import GitHubStorageDialog, { type Resource } from "@/components/GitHubStorageDialog";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("home");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleNewDocument = () => {
    router.push("/edit");
  };

  const handleOpenFromGitHub = () => {
    setDialogOpen(true);
  };

  const handleLoad = (resource: Resource) => {
    setDialogOpen(false);
    const params = new URLSearchParams();
    params.set("owner", resource.owner);
    params.set("repo", resource.repo);
    params.set("branch", resource.branch);
    if (resource.path) {
      params.set("path", resource.path);
    }
    params.set("filename", resource.filename);
    router.push(`/edit?${params.toString()}`);
  };

  const isAuthenticated = !!session?.accessToken;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gray-800 dark:bg-gray-950 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeSwitcher />
          <AuthButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            {t("title")}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t("description")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
          {/* New Document */}
          <button
            onClick={handleNewDocument}
            className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-400 text-left"
          >
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
              {t("newDocument")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t("newDocumentDesc")}
            </p>
          </button>

          {/* Open from GitHub */}
          <button
            onClick={handleOpenFromGitHub}
            disabled={!isAuthenticated}
            className={`p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-shadow border-2 border-transparent text-left ${
              isAuthenticated
                ? "hover:shadow-lg hover:border-green-500 dark:hover:border-green-400"
                : "opacity-60 cursor-not-allowed"
            }`}
          >
            <div className="text-4xl mb-4">🐙</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
              {t("openFromGitHub")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {isAuthenticated
                ? t("openFromGitHubDesc")
                : t("signInRequired")}
            </p>
          </button>
        </div>

        {!isAuthenticated && (
          <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
            {t("signInPrompt")}
          </p>
        )}
      </main>

      <GitHubStorageDialog
        open={dialogOpen}
        type="load"
        onLoad={handleLoad}
        onCancel={() => setDialogOpen(false)}
      />
    </div>
  );
}
