import { getRepoContext } from './services/github';
import { generateReadmeWithGemini } from './services/gemini';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'GENERATE_README') {
        handleGenerateReadme(request.url)
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep the message channel open for async response
    }
});

async function handleGenerateReadme(url: string) {
    const cacheKey = `readme_${url}`;

    // 1. Check Cache
    const cached = await chrome.storage.local.get(cacheKey);
    if (cached[cacheKey]) {
        return cached[cacheKey];
    }

    // 2. Get API Key
    const storage = await chrome.storage.local.get('geminiApiKey');
    const apiKey = storage.geminiApiKey as string;

    if (!apiKey) {
        throw new Error("Gemini API key is not configured. Please set it in Options.");
    }

    // 3. Get GitHub Context
    const context = await getRepoContext(url);

    // 4. Generate README
    const readmeContent = await generateReadmeWithGemini(apiKey, context);

    // 5. Cache the result
    await chrome.storage.local.set({ [cacheKey]: readmeContent });

    return readmeContent;
}
