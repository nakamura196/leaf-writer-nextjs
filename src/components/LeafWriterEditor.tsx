"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import GitHubStorageDialog, { type Resource } from "./GitHubStorageDialog";
import { getFileContent } from "@/lib/github";

interface LeafwriterInstance {
  init(options: {
    document?: { xml?: string; url?: string }
    user?: { name: string; uri: string }
    settings?: { baseUrl?: string }
  }): Promise<void>
  getContent(): Promise<string | undefined>
}

interface LeafwriterClass {
  new (container: HTMLElement): LeafwriterInstance
}

declare global {
  interface Window {
    Leafwriter: {
      Leafwriter: LeafwriterClass
    }
  }
}

interface GitHubParams {
  owner: string;
  repo: string;
  branch: string;
  path: string;
  filename: string;
}

interface LeafWriterEditorProps {
  initialXml: string;
  documentUrl?: string;
  user?: {
    name: string;
    uri: string;
  };
  githubParams?: GitHubParams;
}

export default function LeafWriterEditor({
  initialXml,
  documentUrl,
  user,
  githubParams,
}: LeafWriterEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<LeafwriterInstance | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"load" | "save">("load");
  const [currentResource, setCurrentResource] = useState<Resource | undefined>();
  const [pendingContent, setPendingContent] = useState<string | undefined>();
  const [autoLoadAttempted, setAutoLoadAttempted] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("editor");

  // Update URL with current resource
  const updateUrl = useCallback((resource: Resource) => {
    const params = new URLSearchParams();
    params.set("owner", resource.owner);
    params.set("repo", resource.repo);
    params.set("branch", resource.branch);
    if (resource.path) {
      params.set("path", resource.path);
    }
    params.set("filename", resource.filename);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router]);

  // Auto-load file from GitHub if params are provided (after editor is ready)
  useEffect(() => {
    if (!githubParams || !session?.accessToken || !editorReady || autoLoadAttempted) return;

    setAutoLoadAttempted(true);

    const loadFromParams = async () => {
      try {
        const filePath = githubParams.path
          ? `${githubParams.path}/${githubParams.filename}`
          : githubParams.filename;

        const { content, sha } = await getFileContent(
          githubParams.owner,
          githubParams.repo,
          filePath,
          githubParams.branch
        );

        const resource: Resource = {
          owner: githubParams.owner,
          repo: githubParams.repo,
          branch: githubParams.branch,
          path: githubParams.path,
          filename: githubParams.filename,
          content,
          sha,
        };

        setCurrentResource(resource);

        await editorRef.current?.init({
          document: {
            xml: content,
            url: `https://github.com/${resource.owner}/${resource.repo}/blob/${resource.branch}/${resource.path ? resource.path + "/" : ""}${resource.filename}`,
          },
          user: user,
          settings: {
            baseUrl: "/leafwriter",
          },
        });
      } catch (error) {
        console.error("Failed to load file from URL params:", error);
      }
    };

    loadFromParams();
  }, [githubParams, session?.accessToken, editorReady, autoLoadAttempted, user]);

  useEffect(() => {
    // Load the LEAF-Writer script
    const script = document.createElement("script");
    script.src = "/leafwriter/index.min.js";
    script.async = true;
    script.onload = () => setIsLoaded(true);
    document.body.appendChild(script);

    // Load the CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/leafwriter/css/index.css";
    document.head.appendChild(link);

    return () => {
      document.body.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || editorRef.current) return;

    const initEditor = async () => {
      if (!window.Leafwriter) {
        console.error("Leafwriter not loaded");
        return;
      }

      const editor = new window.Leafwriter.Leafwriter(containerRef.current!);
      editorRef.current = editor;

      await editor.init({
        document: {
          xml: initialXml,
          url: documentUrl,
        },
        user: user,
        settings: {
          baseUrl: "/leafwriter",
        },
      });

      setEditorReady(true);
    };

    initEditor();
  }, [isLoaded, initialXml, documentUrl, user]);

  const handleDownload = async () => {
    if (!editorRef.current) return;

    const content = await editorRef.current.getContent();
    if (!content) return;
    const blob = new Blob([content], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentResource?.filename || "document.xml";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenLoad = () => {
    setDialogType("load");
    setDialogOpen(true);
  };

  const handleOpenSave = async () => {
    if (!editorRef.current) return;

    // Get current content before opening dialog
    const content = await editorRef.current.getContent();
    if (!content) return;

    setPendingContent(content);
    setDialogType("save");
    setDialogOpen(true);
  };

  const handleLoad = async (resource: Resource) => {
    setDialogOpen(false);
    if (!resource.content || !editorRef.current) return;

    setCurrentResource(resource);
    updateUrl(resource);

    // Re-initialize editor with new content
    await editorRef.current.init({
      document: {
        xml: resource.content,
        url: `https://github.com/${resource.owner}/${resource.repo}/blob/${resource.branch}/${resource.path ? resource.path + "/" : ""}${resource.filename}`,
      },
      user: user,
      settings: {
        baseUrl: "/leafwriter",
      },
    });
  };

  const handleSave = async (resource: Resource) => {
    // Update current resource with new location info
    const updatedResource = {
      ...resource,
      content: pendingContent,
    };
    setCurrentResource(updatedResource);
    updateUrl(updatedResource);
    setPendingContent(undefined);
    setDialogOpen(false);
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setPendingContent(undefined);
  };

  const isAuthenticated = !!session?.accessToken;

  // Create resource with pending content for save dialog
  const dialogResource = dialogType === "save" && pendingContent
    ? { ...currentResource, content: pendingContent } as Resource
    : currentResource;

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 p-2 bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700">
        {isAuthenticated && (
          <>
            <button
              onClick={handleOpenLoad}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {t("loadFromGitHub")}
            </button>
            <button
              onClick={handleOpenSave}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              {t("saveToGitHub")}
            </button>
          </>
        )}
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {t("download")}
        </button>
        {currentResource?.filename && (
          <span className="px-4 py-2 text-gray-600 dark:text-gray-300">
            {currentResource.owner}/{currentResource.repo}/{currentResource.path ? `${currentResource.path}/` : ""}{currentResource.filename}
          </span>
        )}
      </div>
      <div
        id="leaf-writer-container"
        ref={containerRef}
        className="flex-1"
        style={{ height: "calc(100vh - 60px)" }}
      />
      <GitHubStorageDialog
        open={dialogOpen}
        type={dialogType}
        resource={dialogResource}
        onLoad={handleLoad}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
