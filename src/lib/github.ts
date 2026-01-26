"use server"

import { auth } from "@/auth"

export interface Repository {
  id: number
  name: string
  full_name: string
  owner: {
    login: string
    type: string
  }
  default_branch: string
  private: boolean
}

export interface Branch {
  name: string
  protected: boolean
}

export interface FileItem {
  name: string
  path: string
  sha: string
  type: "file" | "dir"
  size?: number
}

export interface FileContent {
  name: string
  path: string
  sha: string
  content: string
  encoding: string
}

export interface PaginatedResult<T> {
  items: T[]
  totalCount: number
  hasMore: boolean
}

async function getAccessToken(): Promise<string> {
  const session = await auth()
  if (!session?.accessToken) {
    throw new Error("Not authenticated")
  }
  return session.accessToken
}

async function githubFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = await getAccessToken()
  const response = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `GitHub API error: ${response.status}`)
  }

  return response.json()
}

const PER_PAGE = 10

export async function listRepositories(
  page: number = 1,
  search: string = ""
): Promise<PaginatedResult<Repository>> {
  if (search) {
    // Use search API for filtering
    const result = await githubFetch<{ total_count: number; items: Repository[] }>(
      `/search/repositories?q=${encodeURIComponent(search)}+user:@me&per_page=${PER_PAGE}&page=${page}&sort=updated`
    )
    return {
      items: result.items,
      totalCount: result.total_count,
      hasMore: result.total_count > page * PER_PAGE,
    }
  }

  // List all user repos without search
  const repos = await githubFetch<Repository[]>(
    `/user/repos?per_page=${PER_PAGE}&page=${page}&sort=updated`
  )

  return {
    items: repos,
    totalCount: -1, // Unknown total without search API
    hasMore: repos.length === PER_PAGE,
  }
}

export async function listBranches(owner: string, repo: string): Promise<Branch[]> {
  return githubFetch<Branch[]>(`/repos/${owner}/${repo}/branches`)
}

export async function listFiles(
  owner: string,
  repo: string,
  path: string = "",
  branch?: string
): Promise<FileItem[]> {
  const ref = branch ? `?ref=${branch}` : ""
  const contents = await githubFetch<FileItem | FileItem[]>(
    `/repos/${owner}/${repo}/contents/${path}${ref}`
  )
  return Array.isArray(contents) ? contents : [contents]
}

export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  branch?: string
): Promise<{ content: string; sha: string }> {
  const ref = branch ? `?ref=${branch}` : ""
  const file = await githubFetch<FileContent>(
    `/repos/${owner}/${repo}/contents/${path}${ref}`
  )

  if (file.encoding === "base64") {
    const content = Buffer.from(file.content, "base64").toString("utf-8")
    return { content, sha: file.sha }
  }

  return { content: file.content, sha: file.sha }
}

export async function saveFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha?: string,
  branch?: string
): Promise<{ sha: string }> {
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content).toString("base64"),
  }

  if (sha) {
    body.sha = sha
  }

  if (branch) {
    body.branch = branch
  }

  const result = await githubFetch<{ content: { sha: string } }>(
    `/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    }
  )

  return { sha: result.content.sha }
}
