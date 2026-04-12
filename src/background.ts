import { getRepoContext } from './services/github';
import { generateREADME } from './services/llmRouter';

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

    // 2. Get GitHub Context
    const context = await getRepoContext(url);

    // 3. Generate README via provider-agnostic router
    //    (Gemini → OpenAI → template fallback — all handled inside generateREADME)
    const readmeContent = await generateREADME(context);

    // 4. Cache the result
    await chrome.storage.local.set({ [cacheKey]: readmeContent });

    return readmeContent;
}
