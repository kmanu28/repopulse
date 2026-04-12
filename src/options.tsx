import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const Options = () => {
    const [geminiKey, setGeminiKey] = useState('');
    const [openaiKey, setOpenaiKey] = useState('');
    const [ghToken, setGhToken] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        // Load saved keys from chrome storage
        if (chrome && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['geminiApiKey', 'openaiApiKey', 'GH_TOKEN'], (result) => {
                if (result.geminiApiKey) setGeminiKey(result.geminiApiKey as string);
                if (result.openaiApiKey) setOpenaiKey(result.openaiApiKey as string);
                if (result.GH_TOKEN)     setGhToken(result.GH_TOKEN as string);
            });
        }
    }, []);

    const saveOptions = () => {
        if (chrome && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set(
                { geminiApiKey: geminiKey, openaiApiKey: openaiKey, GH_TOKEN: ghToken },
                () => {
                    setStatus('Options saved.');
                    setTimeout(() => setStatus(''), 2000);
                }
            );
        } else {
            setStatus('Chrome storage API not available.');
        }
    };

    const inputClass =
        "shadow appearance-none border border-gray-600 rounded w-full py-2 px-3 bg-gray-900 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";
    const labelClass = "block text-gray-400 text-sm font-bold mb-2";

    return (
        <div className="p-8 max-w-md w-full bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl backdrop-blur-md">
            <h1 className="text-2xl font-bold mb-2 text-white">RepoPulse Settings</h1>
            <p className="text-gray-500 text-xs mb-6">
                Configure your LLM provider keys. The router tries <strong className="text-gray-300">Gemini → OpenAI → Template</strong> in order.
            </p>

            {/* ── Gemini (Primary Provider) ── */}
            <div className="mb-5">
                <label className={labelClass} htmlFor="geminiKey">
                    Gemini API Key
                    <span className="ml-2 text-xs font-normal text-indigo-400">(Primary provider)</span>
                </label>
                <input
                    id="geminiKey"
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className={inputClass}
                />
                <p className="text-gray-500 text-xs mt-1">
                    Get your key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-blue-400 underline">aistudio.google.com</a>.
                </p>
            </div>

            {/* ── OpenAI (Fallback Provider) ── */}
            <div className="mb-5">
                <label className={labelClass} htmlFor="openaiKey">
                    OpenAI API Key
                    <span className="ml-2 text-xs font-normal text-yellow-400">(Fallback provider)</span>
                </label>
                <input
                    id="openaiKey"
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-..."
                    className={inputClass}
                />
                <p className="text-gray-500 text-xs mt-1">
                    Used automatically if Gemini is unavailable or unconfigured.
                </p>
            </div>

            {/* ── GitHub PAT ── */}
            <div className="mb-5">
                <label className={labelClass} htmlFor="ghToken">
                    GitHub Personal Access Token (PAT)
                </label>
                <input
                    id="ghToken"
                    type="password"
                    value={ghToken}
                    onChange={(e) => setGhToken(e.target.value)}
                    placeholder="ghp_..."
                    className={inputClass}
                />
                <p className="text-gray-500 text-xs mt-1">
                    Used to bypass GitHub API rate limits. Stored securely in chrome.storage.local.
                </p>
            </div>

            <div className="flex items-center justify-between mt-6">
                <button
                    onClick={saveOptions}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
                >
                    Save
                </button>
                <span className="text-green-400 text-sm">{status}</span>
            </div>
        </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(
    <React.StrictMode>
        <Options />
    </React.StrictMode>
);
