/**
 * llmRouter.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Provider-agnostic LLM routing layer for RepoPulse_OS.
 *
 * Architecture:
 *   generateREADME(context)
 *     → withTimeout( geminiProvider )   ← primary
 *     → withTimeout( openAIProvider )   ← fallback
 *     → templateFallback               ← final guaranteed fallback
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RepoContext {
    owner: string;
    repo: string;
    tree: string[];
    techFileContent: string;
    entryPointContent: string;
}

interface ApiKeys {
    geminiApiKey?: string;
    openaiApiKey?: string;
}

// ─── Shared prompt builder ────────────────────────────────────────────────────

function buildPrompt(context: RepoContext): string {
    return `
You are an elite, professional Staff Technical Writer and Developer Advocate. Write a high-quality, comprehensive, and engaging README.md for the GitHub repository '${context.owner}/${context.repo}'.

Repository Context:
- File tree: ${JSON.stringify(context.tree)}

Key Tech Files:
${context.techFileContent}

Primary Entry Point:
${context.entryPointContent}

Output Requirements:
- The tone should be human-like, formal, and accessible to other developers. Provide sufficient detail to understand the project's core value proposition. Write naturally and avoid overly formal 'AI' jargon (e.g., do not use words like 'delve', 'elevate', 'seamless', 'robust', 'unlock', etc.).
- Do NOT overuse emojis. Keep them to an absolute minimum or avoid them entirely for a more professional look.
- Section 1: Title and a powerful 1-line developer-focused tagline.
- Section 2: "Executive Summary". Provide a detailed paragraph (5-7 sentences) explaining what the project is, the problem it solves, and its primary capabilities. Make it compelling but grounded.
- Section 3: "Architecture Overview" with a clear, well-structured **Mermaid.js diagram** (\`\`\`mermaid) illustrating the system flow or component interactions. CRITICAL MERMAID RULES: You MUST enclose all subgraph IDs containing spaces in quotes (e.g. \`subgraph id ["Name With Spaces"]\`). You MUST enclose node texts containing special characters or spaces in double quotes (e.g., \`A["User (Client)"] --> B("Server")\`). Never use spaces directly in subgraph IDs. Include a brief text explanation below the diagram.
- Section 4: "Technical Stack" using strictly **Markdown badges** (e.g., Shields.io) grouped logically (e.g., Frontend, Backend, Tools).
- Section 5: "Getting Started" with the essential commands to install dependencies, configure the environment, and run the project locally.

Output only the raw Markdown content for the README. Do not include markdown \`\`\`\` wrappers around the entire response.
`.trim();
}

// ─── Timeout wrapper ──────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`[LLMRouter] ${label} timed out after ${ms}ms`)), ms)
    );
    return Promise.race([promise, timeout]);
}

// ─── Provider: Gemini ─────────────────────────────────────────────────────────

async function geminiProvider(context: RepoContext, apiKey: string): Promise<string> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: buildPrompt(context) }] }]
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`[Gemini] ${err?.error?.message || `HTTP ${response.status}`}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("[Gemini] Empty response from API.");
    return text.trim();
}

// ─── Provider: OpenAI ─────────────────────────────────────────────────────────

async function openAIProvider(context: RepoContext, apiKey: string): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an elite technical writer. Output only raw Markdown — no code fences around the entire response."
                },
                {
                    role: "user",
                    content: buildPrompt(context)
                }
            ],
            temperature: 0.4
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`[OpenAI] ${err?.error?.message || `HTTP ${response.status}`}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("[OpenAI] Empty response from API.");
    return text.trim();
}

// ─── Final fallback: Template generator ───────────────────────────────────────

function templateFallback(context: RepoContext): string {
    const { owner, repo, tree, techFileContent } = context;

    // Detect stack from file tree
    const hasPackageJson = tree.includes("package.json");
    const hasPython = tree.some(f => f.endsWith(".py"));
    const hasGo = tree.includes("go.mod");
    const hasRust = tree.includes("Cargo.toml");
    const hasJava = tree.includes("pom.xml") || tree.includes("build.gradle");

    let stackBadges = "";
    if (hasPackageJson) stackBadges += `![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white) `;
    if (hasPython)     stackBadges += `![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white) `;
    if (hasGo)         stackBadges += `![Go](https://img.shields.io/badge/Go-00ADD8?logo=go&logoColor=white) `;
    if (hasRust)       stackBadges += `![Rust](https://img.shields.io/badge/Rust-000000?logo=rust&logoColor=white) `;
    if (hasJava)       stackBadges += `![Java](https://img.shields.io/badge/Java-ED8B00?logo=openjdk&logoColor=white) `;
    if (!stackBadges)  stackBadges = "_(Stack detection unavailable)_";

    // Parse a dependency count hint from techFileContent
    const depHint = techFileContent.length > 50
        ? `\nProject configuration detected. Review the \`${tree.find(f => ["package.json","requirements.txt","go.mod","Cargo.toml"].includes(f)) || "config file"}\` for full dependency details.\n`
        : "";

    return `# ${repo}

> An open-source project by [${owner}](https://github.com/${owner}).

## Executive Summary

**${repo}** is a project hosted at [github.com/${owner}/${repo}](https://github.com/${owner}/${repo}). This README was generated using a template fallback because all AI providers were unavailable at the time of generation. Please regenerate once API keys are configured, or fill in the sections below manually to describe the project's purpose, features, and capabilities.
${depHint}
## Architecture Overview

\`\`\`mermaid
flowchart TD
    A["User"] --> B["${repo}"]
    B --> C["Core Logic"]
    C --> D["Output"]
\`\`\`

_Architecture diagram placeholder. Regenerate with a valid API key for a detailed system diagram._

## Technical Stack

${stackBadges}

## Getting Started

\`\`\`bash
# Clone the repository
git clone https://github.com/${owner}/${repo}.git
cd ${repo}

# Install dependencies (adjust for your stack)
npm install        # Node.js
# pip install -r requirements.txt  # Python
# go mod download                  # Go

# Run the project
npm start
\`\`\`

## File Structure

\`\`\`
${tree.slice(0, 30).join("\n")}${tree.length > 30 ? `\n... and ${tree.length - 30} more files` : ""}
\`\`\`

---

> **Note:** This README was auto-generated using the template fallback. AI providers (Gemini, OpenAI) were unreachable. Configure your API keys in RepoPulse Settings and regenerate for a richer result.
`.trim();
}

// ─── Main exported router ─────────────────────────────────────────────────────

const PROVIDER_TIMEOUT_MS = 12000; // 12 seconds per provider attempt

/**
 * generateREADME
 *
 * The single entry-point for all README generation. Tries providers in order:
 *   1. Gemini (primary)          — requires `geminiApiKey` in chrome.storage.local
 *   2. OpenAI (fallback)         — requires `openaiApiKey` in chrome.storage.local
 *   3. Template (final fallback) — always succeeds, no API key needed
 *
 * @param context - Structured repository context from getRepoContext()
 * @returns Markdown string of the generated README
 */
export async function generateREADME(context: RepoContext): Promise<string> {
    // Retrieve all API keys at once
    let keys: ApiKeys = {};
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
        keys = await chrome.storage.local.get(["geminiApiKey", "openaiApiKey"]) as ApiKeys;
    }

    const errors: string[] = [];

    // ── 1. Gemini (primary) ────────────────────────────────────────────────
    if (keys.geminiApiKey) {
        try {
            console.log("[LLMRouter] Attempting Gemini provider...");
            const result = await withTimeout(
                geminiProvider(context, keys.geminiApiKey),
                PROVIDER_TIMEOUT_MS,
                "Gemini"
            );
            console.log("[LLMRouter] Gemini succeeded.");
            return result;
        } catch (err: any) {
            const msg = err?.message ?? String(err);
            console.warn(`[LLMRouter] Gemini failed: ${msg}`);
            errors.push(msg);
        }
    } else {
        console.info("[LLMRouter] Gemini API key not configured — skipping.");
    }

    // ── 2. OpenAI (fallback) ───────────────────────────────────────────────
    if (keys.openaiApiKey) {
        try {
            console.log("[LLMRouter] Attempting OpenAI provider...");
            const result = await withTimeout(
                openAIProvider(context, keys.openaiApiKey),
                PROVIDER_TIMEOUT_MS,
                "OpenAI"
            );
            console.log("[LLMRouter] OpenAI succeeded.");
            return result;
        } catch (err: any) {
            const msg = err?.message ?? String(err);
            console.warn(`[LLMRouter] OpenAI failed: ${msg}`);
            errors.push(msg);
        }
    } else {
        console.info("[LLMRouter] OpenAI API key not configured — skipping.");
    }

    // ── 3. Template (final guaranteed fallback) ────────────────────────────
    console.warn("[LLMRouter] All providers failed or unconfigured. Using template fallback.");
    if (errors.length > 0) {
        console.warn("[LLMRouter] Accumulated errors:", errors.join(" | "));
    }
    return templateFallback(context);
}
