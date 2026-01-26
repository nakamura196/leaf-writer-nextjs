"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AuthButton from "@/components/AuthButton";
import GitHubStorageDialog, { type Resource } from "@/components/GitHubStorageDialog";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleNewDocument = () => {
    router.push("/edit");
  };

  const handleOpenFromGitHub = () => {
    setDialogOpen(true);
  };

  const handleLoad = (resource: Resource) => {
    setDialogOpen(false);
    // Navigate to editor with GitHub params
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">LEAF-Writer</h1>
        <AuthButton />
      </header>

      <main className="max-w-4xl mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            LEAF-Writer
          </h2>
          <p className="text-lg text-gray-600">
            A web-based XML editor for TEI documents
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
          {/* New Document */}
          <button
            onClick={handleNewDocument}
            className="p-8 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500 text-left"
          >
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              New Document
            </h3>
            <p className="text-gray-600">
              Start with a blank TEI template
            </p>
          </button>

          {/* Open from GitHub */}
          <button
            onClick={handleOpenFromGitHub}
            disabled={!isAuthenticated}
            className={`p-8 bg-white rounded-lg shadow-md transition-shadow border-2 border-transparent text-left ${
              isAuthenticated
                ? "hover:shadow-lg hover:border-green-500"
                : "opacity-60 cursor-not-allowed"
            }`}
          >
            <div className="text-4xl mb-4">🐙</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Open from GitHub
            </h3>
            <p className="text-gray-600">
              {isAuthenticated
                ? "Load a document from your GitHub repository"
                : "Sign in to access GitHub repositories"}
            </p>
          </button>
        </div>

        {!isAuthenticated && (
          <p className="text-center text-gray-500 mt-8">
            Sign in with GitHub to load and save documents to your repositories.
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
