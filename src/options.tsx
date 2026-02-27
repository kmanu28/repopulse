import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const Options = () => {
    const [apiKey, setApiKey] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        // Load saved API key
        if (chrome && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['geminiApiKey'], (result) => {
                if (result.geminiApiKey) {
                    setApiKey(result.geminiApiKey as string);
                }
            });
        }
    }, []);

    const saveOptions = () => {
        if (chrome && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
                setStatus('Options saved.');
                setTimeout(() => setStatus(''), 2000);
            });
        } else {
            setStatus('Chrome storage API not available.');
        }
    };

    return (
        <div className="p-8 max-w-md w-full bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl backdrop-blur-md">
            <h1 className="text-2xl font-bold mb-6 text-white">RepoPulse Settings</h1>

            <div className="mb-4">
                <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="apiKey">
                    Gemini 2.5 Flash API Key
                </label>
                <input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="shadow appearance-none border border-gray-600 rounded w-full py-2 px-3 bg-gray-900 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <p className="text-gray-500 text-xs mt-2">
                    Your key is stored securely in chrome.storage.local.
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
