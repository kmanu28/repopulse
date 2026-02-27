import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Download, RefreshCw, Settings, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [url, setUrl] = useState('');
  const [isGitHubEnv, setIsGitHubEnv] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');

  useEffect(() => {
    // Fallback URL for test mode if chrome.tabs is not available (like normal web load)
    if (!chrome || !chrome.tabs || !chrome.tabs.query) {
      console.warn("Not running in Chrome Extension environment");
      setIsGitHubEnv(true);
      setUrl('https://github.com/microsoft/TypeScript'); // Dummy test mapping
      return;
    }

    // Check if we are on a GitHub repository
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentUrl = tabs[0]?.url || '';
      if (currentUrl.includes('github.com')) {
        setIsGitHubEnv(true);
        setUrl(currentUrl);
      } else {
        setIsGitHubEnv(false);
      }
    });
  }, []);

  const openOptions = () => {
    if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('/options.html');
    }
  };

  const handleGenerate = () => {
    if (!url) return;
    setLoading(true);
    setError(null);

    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(
        { action: 'GENERATE_README', url },
        (response) => {
          setLoading(false);
          if (response?.success) {
            setMarkdown(response.data);
            setActiveTab('preview');
          } else {
            setError(response?.error || 'Failed to generate README.');
          }
        }
      );
    } else {
      setLoading(false);
      setError("Chrome extension runtime unvailable. Check if extension loaded correctly.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdown);
  };

  const downloadFile = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = 'README.md';
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden crt bg-[var(--color-retro-bg)] text-[var(--color-retro-text)] font-mono selection:bg-[var(--color-retro-accent)] selection:text-[var(--color-retro-bg)]">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-retro-border)] bg-[var(--color-retro-panel)] z-10 sticky top-0 shadow-[0_2px_0_rgba(99,102,241,0.2)]">
        <div className="flex items-center gap-4">
          <Terminal className="text-[var(--color-retro-accent)] w-6 h-6 animate-pulse" />
          <h1 className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-retro-border)] via-[var(--color-retro-accent)] to-[var(--color-retro-border)] uppercase" style={{ textShadow: '1px 1px 0px rgba(192,132,252,0.2)' }}>
            RepoPulse_OS
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openOptions} className="p-2 border border-[var(--color-retro-border)] hover:bg-[var(--color-retro-border)] hover:bg-opacity-20 rounded transition-all text-[var(--color-retro-text)] hover:text-[var(--color-retro-accent)] shadow-[1px_1px_0_var(--color-retro-accent)]" title="Settings">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-6 overflow-hidden relative z-10 w-full max-w-5xl mx-auto">
        {!isGitHubEnv ? (
          <div className="flex-1 flex items-center justify-center flex-col text-center retro-window p-8">
            <Terminal className="w-16 h-16 text-[var(--color-retro-accent)] mb-6 animate-pulse neon-text" />
            <h2 className="text-2xl font-bold mb-4 tracking-wider uppercase text-[var(--color-retro-text)] border-b border-[var(--color-retro-border)] pb-2 inline-block">Error_0x404</h2>
            <p className="text-indigo-300 text-base max-w-md font-mono mt-4">&gt;&gt; SYSTEM HALTED. Target is not a recognized GitHub repository. Awaiting valid input sequence...</p>
          </div>
        ) : (
          <>
            {/* Generate Controls */}
            <div className="mb-8 retro-window p-4 flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 w-full relative group">
                <span className="absolute left-3 top-3 text-[var(--color-retro-border)] font-bold">{'>'}</span>
                <input
                  type="text"
                  value={url}
                  readOnly
                  className="w-full bg-[var(--color-retro-bg)] border border-[var(--color-retro-border)] focus:border-[var(--color-retro-accent)] focus:shadow-[0_0_10px_rgba(192,132,252,0.3)] rounded px-8 py-3 text-sm text-[var(--color-retro-accent)] outline-none transition-all"
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-[var(--color-retro-panel)] hover:bg-[var(--color-retro-border)] hover:bg-opacity-20 border border-[var(--color-retro-border)] hover:border-[var(--color-retro-accent)] disabled:bg-slate-900 disabled:border-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-[var(--color-retro-accent)] hover:text-white px-8 py-3 rounded text-sm font-bold tracking-widest uppercase transition-all shadow-[2px_2px_0_var(--color-retro-border)] hover:shadow-[1px_1px_0_var(--color-retro-accent)] hover:translate-x-[1px] hover:translate-y-[1px]"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'EXEC_GENERATE'}
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-900/40 border-l-4 border-red-500 text-red-400 font-mono text-sm uppercase tracking-wider backdrop-blur-sm">
                !! SYSTEM_ERR: {error}
              </div>
            )}

            {/* Split Pane / Tabs */}
            {markdown || loading ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden retro-window">
                <div className="flex items-center justify-between border-b border-[var(--color-retro-border)] bg-[var(--color-retro-bg)] px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab('preview')}
                      className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest border transition-all rounded-sm ${activeTab === 'preview' ? 'bg-[var(--color-retro-accent)] text-[var(--color-retro-bg)] border-[var(--color-retro-accent)] shadow-[1px_1px_0_var(--color-retro-border)]' : 'bg-[var(--color-retro-panel)] text-indigo-300 border-[var(--color-retro-border)] hover:bg-indigo-900/50 hover:text-white'}`}
                    >
                      COM_RENDER
                    </button>
                    <button
                      onClick={() => setActiveTab('raw')}
                      className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest border transition-all rounded-sm ${activeTab === 'raw' ? 'bg-[var(--color-retro-accent)] text-[var(--color-retro-bg)] border-[var(--color-retro-accent)] shadow-[1px_1px_0_var(--color-retro-border)]' : 'bg-[var(--color-retro-panel)] text-indigo-300 border-[var(--color-retro-border)] hover:bg-indigo-900/50 hover:text-white'}`}
                    >
                      RAW_DATA
                    </button>
                  </div>
                  {markdown && !loading && (
                    <div className="flex gap-3">
                      <button onClick={copyToClipboard} title="Copy Markdown" className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase border border-[var(--color-retro-border)] text-[var(--color-retro-accent)] hover:bg-[var(--color-retro-accent)] hover:bg-opacity-20 hover:text-white transition-all shadow-[1px_1px_0_var(--color-retro-border)] rounded-sm">
                        <Copy className="w-4 h-4" /> COPY_BUF
                      </button>
                      <button onClick={downloadFile} title="Download README.md" className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase border border-blue-500 text-blue-400 hover:bg-blue-500 hover:bg-opacity-20 hover:text-white transition-all shadow-[1px_1px_0_theme(colors.blue.500)] rounded-sm">
                        <Download className="w-4 h-4" /> DUMP_MEM
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-auto relative bg-[var(--color-retro-bg)]">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 p-8 flex flex-col items-center justify-center font-mono"
                      >
                        <div className="text-[var(--color-retro-accent)] mb-6 neon-text text-xl animate-pulse tracking-widest">
                          PROCESSING...
                        </div>
                        {/* Retro Progress Bar */}
                        <div className="w-full max-w-md border border-[var(--color-retro-border)] p-1 h-6 bg-[var(--color-retro-panel)] rounded-sm">
                          <motion.div
                            className="h-full bg-[var(--color-retro-accent)] opacity-80"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          />
                        </div>
                        <div className="mt-6 text-indigo-300 text-xs tracking-wider opacity-80 typing-animation">
                          &gt; Establishing neural uplink...<br />
                          &gt; Analyzing repository vectors...<br />
                          &gt; Synthesizing documentation output...
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full"
                      >
                        {activeTab === 'preview' ? (
                          <div className="p-8 md:p-12 max-w-4xl mx-auto">
                            <div className="text-[var(--color-retro-text)] font-mono leading-relaxed max-w-none text-[14px]">
                              <ReactMarkdown
                                components={{
                                  h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-[var(--color-retro-accent)] mb-8 pb-3 border-b border-[var(--color-retro-border)] uppercase tracking-wider neon-text" {...props} />,
                                  h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-indigo-400 mt-10 mb-5 uppercase tracking-wide border-b border-dashed border-[var(--color-retro-border)] pb-2 before:content-['>>_'] before:text-[var(--color-retro-accent)]" {...props} />,
                                  h3: ({ node, ...props }) => <h3 className="text-base font-bold text-indigo-300 mt-8 mb-4 tracking-wide before:content-['>_']" {...props} />,
                                  p: ({ node, ...props }) => <p className="mb-6 text-slate-300 leading-relaxed" {...props} />,
                                  ul: ({ node, ...props }) => <ul className="list-none pl-4 mb-6 space-y-2 border-l border-[var(--color-retro-border)]" {...props} />,
                                  ol: ({ node, ...props }) => <ol className="list-decimal pl-8 mb-6 space-y-2 text-[var(--color-retro-accent)]" {...props} />,
                                  li: ({ node, ...props }) => <li className="relative pl-6 before:content-['[*]'] before:absolute before:-left-1 before:text-[var(--color-retro-border)] text-slate-300" {...props} />,
                                  a: ({ node, ...props }) => <a className="text-blue-400 hover:text-[var(--color-retro-accent)] underline decoration-[var(--color-retro-border)] hover:bg-[var(--color-retro-border)] hover:bg-opacity-20 px-1 transition-colors" {...props} />,
                                  code: ({ node, inline, ...props }: any) =>
                                    inline ? <code className="bg-[var(--color-retro-panel)] text-[var(--color-retro-accent)] px-1.5 py-0.5 rounded-sm border border-[var(--color-retro-border)] text-[12px]" {...props} />
                                      : <code className="block bg-[var(--color-retro-bg)] border border-[var(--color-retro-border)] p-4 overflow-x-auto text-[13px] my-6 text-emerald-400 shadow-[inset_0_0_10px_rgba(99,102,241,0.1)] rounded-md" {...props} />,
                                  blockquote: ({ node, ...props }) => <blockquote className="border-l-2 border-[var(--color-retro-accent)] bg-[var(--color-retro-panel)] pl-5 py-2 my-6 text-indigo-300 italic" {...props} />,
                                  img: ({ node, ...props }) => <img className="my-6 border border-[var(--color-retro-border)] rounded shadow-sm" {...props} />
                                }}
                              >
                                {markdown}
                              </ReactMarkdown>
                            </div>
                          </div>
                        ) : (
                          <textarea
                            value={markdown}
                            onChange={(e) => setMarkdown(e.target.value)}
                            className="w-full h-full p-8 bg-[var(--color-retro-bg)] resize-none outline-none text-emerald-400 font-mono text-[13px] leading-relaxed"
                            spellCheck={false}
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center flex-col text-center opacity-40 border border-dashed border-[var(--color-retro-border)] m-4 rounded">
                <p className="text-indigo-300 font-mono uppercase tracking-widest text-sm">Awaiting SYS_INPUT...</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
