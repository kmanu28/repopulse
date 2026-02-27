const GITHUB_API = "https://api.github.com";

export async function fetchRepoTree(owner: string, repo: string, sha: string) {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`);
    if (!response.ok) throw new Error("Failed to fetch repository tree");
    return response.json();
}

export async function fetchFileContent(owner: string, repo: string, path: string) {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.content) {
        return atob(data.content); // decoding base64 content
    }
    return null;
}

export async function getRepoContext(url: string) {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) throw new Error("Not a valid GitHub repository URL");

    const owner = match[1];
    const repo = match[2];

    // Fetch default branch
    const repoInfo = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`);
    if (!repoInfo.ok) {
        if (repoInfo.status === 403) throw new Error("GitHub API rate limit exceeded");
        throw new Error("Repository not found or private");
    }
    const repoData = await repoInfo.json();
    const defaultBranch = repoData.default_branch || "main";

    // Fetch tree
    const treeData = await fetchRepoTree(owner, repo, defaultBranch);

    // Extract key files
    const files = treeData.tree.map((t: any) => t.path);

    const techIndicators = ["package.json", "requirements.txt", "go.mod", "pom.xml", "Cargo.toml", "build.gradle"];
    let techFileContent = "";

    for (const indicator of techIndicators) {
        if (files.includes(indicator)) {
            const content = await fetchFileContent(owner, repo, indicator);
            if (content) {
                techFileContent += `\n--- ${indicator} ---\n${content}\n`;
            }
        }
    }

    // Look for a potential entry point
    const entryPointRegex = /^(src\/)?(index|main|app|App)\.(js|ts|tsx|jsx|py|go|rs|java)$/i;
    const entryPointPath = files.find((f: string) => entryPointRegex.test(f));
    let entryPointContent = "";
    if (entryPointPath) {
        const content = await fetchFileContent(owner, repo, entryPointPath);
        if (content) {
            entryPointContent += `\n--- ${entryPointPath} ---\n${content}\n`;
        }
    }

    return {
        owner,
        repo,
        tree: files.slice(0, 500), // Limit to top 500 files to avoid massive prompts
        techFileContent,
        entryPointContent
    };
}
