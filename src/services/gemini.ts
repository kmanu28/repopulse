export async function generateReadmeWithGemini(apiKey: string, context: any) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
  You are an elite, professional Staff Technical Writer and Developer Advocate. Write a high-quality, comprehensive, and engaging README.md for the GitHub repository '${context.owner}/${context.repo}'.
  
  Repository Context:
  - File tree: ${JSON.stringify(context.tree)}
  
  Key Tech Files:
  ${context.techFileContent}
  
  Primary Entry Point:
  ${context.entryPointContent}
  
  Output Requirements:
  - The tone should be highly professional, informative, and accessible to other developers. Provide sufficient detail to understand the project's core value proposition.
  - Section 1: Title and a powerful 1-line developer-focused tagline.
  - Section 2: "Executive Summary". Provide a robust, detailed paragraph (5-7 sentences) explaining what the project is, the problem it solves, and its primary capabilities. Make it compelling.
  - Section 3: "Architecture Overview" with a clear, well-structured **Mermaid.js diagram** (\`\`\`mermaid) illustrating the system flow or component interactions. Include a brief text explanation below the diagram.
  - Section 4: "Technical Stack" using strictly **Markdown badges** (e.g., Shields.io) grouped logically (e.g., Frontend, Backend, Tools).
  - Section 5: "Getting Started" with the essential commands to install dependencies, configure the environment, and run the project locally.
  
  Output only the raw Markdown content for the README. Do not include markdown \`\`\` wrappers around the entire response.
  `;

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [{ text: prompt }]
                }
            ]
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Gemini API failed to generate README.");
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || "";
}
