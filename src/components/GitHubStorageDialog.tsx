"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useTranslations } from "next-intl"
import {
  listRepositories,
  listBranches,
  listFiles,
  getFileContent,
  saveFile,
  type Repository,
  type Branch,
  type FileItem,
} from "@/lib/github"

export interface Resource {
  owner: string
  repo: string
  branch: string
  path: string
  filename: string
  content?: string
  sha?: string
}

interface GitHubStorageDialogProps {
  open: boolean
  type: "load" | "save"
  resource?: Resource
  onLoad?: (resource: Resource) => void
  onSave?: (resource: Resource) => void
  onCancel?: () => void
}

type Step = "repo" | "branch" | "files" | "filename"

export default function GitHubStorageDialog({
  open,
  type,
  resource,
  onLoad,
  onSave,
  onCancel,
}: GitHubStorageDialogProps) {
  const t = useTranslations("github")
  const tErrors = useTranslations("errors")

  const [step, setStep] = useState<Step>("repo")
  const [repos, setRepos] = useState<Repository[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [currentPath, setCurrentPath] = useState<string>("")
  const [filename, setFilename] = useState<string>("")
  const [commitMessage, setCommitMessage] = useState<string>("")

  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [searchInput, setSearchInput] = useState<string>("")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [fileFilter, setFileFilter] = useState<string>("")

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setError(null)
      setCommitMessage(type === "save" ? t("updateDocument") : "")
      setSearchQuery("")
      setSearchInput("")
      setCurrentPage(1)
      setFileFilter("")

      // If saving and we have a current resource, go directly to filename step
      if (type === "save" && resource?.owner && resource?.repo) {
        setSelectedRepo({
          id: 0,
          name: resource.repo,
          full_name: `${resource.owner}/${resource.repo}`,
          owner: { login: resource.owner, type: "User" },
          default_branch: resource.branch || "main",
          private: false,
        })
        setSelectedBranch(resource.branch || "main")
        setCurrentPath(resource.path || "")
        setFilename(resource.filename || "document.xml")
        setStep("filename")
      } else {
        // For load or new save, start from repo selection
        setStep("repo")
        setSelectedRepo(null)
        setSelectedBranch("")
        setCurrentPath("")
        setFilename(resource?.filename || "document.xml")
        loadRepos(1, "")
      }
    }
  }, [open, type, resource, t])

  const loadRepos = async (page: number = 1, search: string = "") => {
    setLoading(true)
    setError(null)
    try {
      const result = await listRepositories(page, search)
      if (page === 1) {
        setRepos(result.items)
      } else {
        setRepos(prev => [...prev, ...result.items])
      }
      setHasMore(result.hasMore)
      setCurrentPage(page)
    } catch (e) {
      setError(tErrors("loadRepos"))
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setSearchQuery(searchInput)
    setCurrentPage(1)
    loadRepos(1, searchInput)
  }

  const handleLoadMore = () => {
    loadRepos(currentPage + 1, searchQuery)
  }

  // Filter files by name (client-side)
  const filteredFiles = useMemo(() => {
    if (!fileFilter) return files
    const lower = fileFilter.toLowerCase()
    return files.filter(f => f.name.toLowerCase().includes(lower))
  }, [files, fileFilter])

  const loadBranches = async (owner: string, repo: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await listBranches(owner, repo)
      setBranches(data)
    } catch (e) {
      setError(tErrors("loadBranches"))
    } finally {
      setLoading(false)
    }
  }

  const loadFiles = useCallback(async (owner: string, repo: string, path: string, branch: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await listFiles(owner, repo, path, branch)
      // Sort: directories first, then files
      data.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name)
        return a.type === "dir" ? -1 : 1
      })
      setFiles(data)
    } catch (e) {
      setError(tErrors("loadFiles"))
      setFiles([])
    } finally {
      setLoading(false)
    }
  }, [tErrors])

  const handleSelectRepo = (repo: Repository) => {
    setSelectedRepo(repo)
    setSelectedBranch(repo.default_branch)
    loadBranches(repo.owner.login, repo.name)
    setStep("branch")
  }

  const handleSelectBranch = (branch: string) => {
    setSelectedBranch(branch)
    if (selectedRepo) {
      setCurrentPath("")
      loadFiles(selectedRepo.owner.login, selectedRepo.name, "", branch)
      setStep("files")
    }
  }

  const handleNavigate = (item: FileItem) => {
    if (!selectedRepo) return

    if (item.type === "dir") {
      const newPath = item.path
      setCurrentPath(newPath)
      setFileFilter("") // Clear filter when navigating
      loadFiles(selectedRepo.owner.login, selectedRepo.name, newPath, selectedBranch)
    } else if (type === "load" && item.name.endsWith(".xml")) {
      handleLoadFile(item)
    } else if (type === "save") {
      setFilename(item.name)
    }
  }

  const handleGoUp = () => {
    if (!selectedRepo || !currentPath) return
    const parts = currentPath.split("/")
    parts.pop()
    const newPath = parts.join("/")
    setCurrentPath(newPath)
    setFileFilter("") // Clear filter when navigating
    loadFiles(selectedRepo.owner.login, selectedRepo.name, newPath, selectedBranch)
  }

  const handleLoadFile = async (item: FileItem) => {
    if (!selectedRepo) return
    setLoading(true)
    setError(null)
    try {
      const { content, sha } = await getFileContent(
        selectedRepo.owner.login,
        selectedRepo.name,
        item.path,
        selectedBranch
      )
      onLoad?.({
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        branch: selectedBranch,
        path: currentPath,
        filename: item.name,
        content,
        sha,
      })
    } catch (e) {
      setError(tErrors("loadFile"))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedRepo || !filename) return
    setStep("filename")
  }

  const handleConfirmSave = async (content: string) => {
    if (!selectedRepo || !filename) return
    setLoading(true)
    setError(null)
    try {
      const filePath = currentPath ? `${currentPath}/${filename}` : filename

      // Check if file exists to get SHA
      let existingSha: string | undefined
      try {
        const existing = await getFileContent(
          selectedRepo.owner.login,
          selectedRepo.name,
          filePath,
          selectedBranch
        )
        existingSha = existing.sha
      } catch {
        // File doesn't exist, that's OK for new files
      }

      const result = await saveFile(
        selectedRepo.owner.login,
        selectedRepo.name,
        filePath,
        content,
        commitMessage || t("updateDocument"),
        existingSha,
        selectedBranch
      )

      onSave?.({
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        branch: selectedBranch,
        path: currentPath,
        filename,
        sha: result.sha,
      })
    } catch (e) {
      setError(tErrors("saveFile"))
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {type === "load" ? t("loadTitle") : t("saveTitle")}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="px-6 py-2 bg-gray-50 dark:bg-gray-900 text-sm flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setStep("repo")}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t("repositories")}
          </button>
          {selectedRepo && (
            <>
              <span className="text-gray-500 dark:text-gray-400">/</span>
              <button
                onClick={() => setStep("branch")}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {selectedRepo.name}
              </button>
            </>
          )}
          {selectedBranch && (step === "files" || step === "filename") && (
            <>
              <span className="text-gray-500 dark:text-gray-400">/</span>
              <span className="text-gray-600 dark:text-gray-300">{selectedBranch}</span>
              {currentPath && (
                <>
                  <span className="text-gray-500 dark:text-gray-400">/</span>
                  <span className="text-gray-600 dark:text-gray-300">{currentPath}</span>
                </>
              )}
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {step === "repo" ? (
            <div className="space-y-4">
              {/* Search input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={t("searchRepos")}
                  className="flex-1 border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {t("search")}
                </button>
              </div>

              {loading && repos.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-gray-500 dark:text-gray-400">{t("loading")}</div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {repos.map((repo) => (
                      <button
                        key={repo.id}
                        onClick={() => handleSelectRepo(repo)}
                        className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border dark:border-gray-600 flex items-center gap-3"
                      >
                        <span className="text-2xl">📁</span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{repo.full_name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {repo.private ? `🔒 ${t("private")}` : `🌐 ${t("public")}`}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Load more button */}
                  {hasMore && (
                    <div className="text-center pt-2">
                      <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50"
                      >
                        {loading ? t("loading") : t("loadMore")}
                      </button>
                    </div>
                  )}

                  {repos.length === 0 && !loading && (
                    <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                      {t("noRepos")}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-gray-500 dark:text-gray-400">{t("loading")}</div>
            </div>
          ) : step === "branch" ? (
            <div className="space-y-2">
              {branches.map((branch) => (
                <button
                  key={branch.name}
                  onClick={() => handleSelectBranch(branch.name)}
                  className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border dark:border-gray-600 flex items-center gap-3"
                >
                  <span className="text-2xl">🌿</span>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{branch.name}</div>
                    {branch.protected && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">{t("protected")}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : step === "files" ? (
            <div className="space-y-4">
              {/* File filter input */}
              <input
                type="text"
                value={fileFilter}
                onChange={(e) => setFileFilter(e.target.value)}
                placeholder={t("filterFiles")}
                className="w-full border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />

              <div className="space-y-2">
                {currentPath && (
                  <button
                    onClick={handleGoUp}
                    className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border dark:border-gray-600 flex items-center gap-3"
                  >
                    <span className="text-2xl">⬆️</span>
                    <div className="font-medium text-gray-900 dark:text-gray-100">..</div>
                  </button>
                )}
                {filteredFiles.map((file) => (
                  <button
                    key={file.sha}
                    onClick={() => handleNavigate(file)}
                    className={`w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border dark:border-gray-600 flex items-center gap-3 ${
                      type === "load" && file.type === "file" && !file.name.endsWith(".xml")
                        ? "opacity-50"
                        : ""
                    }`}
                    disabled={type === "load" && file.type === "file" && !file.name.endsWith(".xml")}
                  >
                    <span className="text-2xl">
                      {file.type === "dir" ? "📁" : "📄"}
                    </span>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{file.name}</div>
                  </button>
                ))}
                {filteredFiles.length === 0 && files.length > 0 && (
                  <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                    {t("noMatchingFiles")}
                  </div>
                )}
                {files.length === 0 && (
                  <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                    {t("emptyFolder")}
                  </div>
                )}
              </div>
            </div>
          ) : step === "filename" ? (
            <div className="space-y-4">
              {/* Show current location */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border dark:border-gray-600">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t("saveLocation")}</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedRepo?.full_name}/{selectedBranch}/{currentPath ? `${currentPath}/` : ""}
                </div>
                <button
                  onClick={() => {
                    setStep("repo")
                    loadRepos()
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2"
                >
                  {t("changeLocation")}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("filename")}
                </label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="w-full border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="document.xml"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("commitMessage")}
                </label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="w-full border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder={t("updateDocument")}
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {t("cancel")}
          </button>
          {type === "save" && step === "files" && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              {t("saveHere")}
            </button>
          )}
          {type === "save" && step === "filename" && (
            <button
              onClick={() => {
                // Get content from parent through a callback pattern
                // For now, we'll trigger the save with the resource content
                if (resource?.content) {
                  handleConfirmSave(resource.content)
                }
              }}
              disabled={!filename || loading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? t("saving") : t("save")}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
