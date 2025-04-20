import React, { useState, useEffect } from 'react'
import {
  getBlockedWebsites,
  addBlockedWebsite,
  removeBlockedWebsite,
  BlockedWebsite,
} from '../services/sitesSupabase'

/**
 * NOTE ­– this file must be saved with a .tsx extension.
 * The only change from the previous version is that *all*
 * interactions with `window.electronAPI` are now type‑cast to
 * `any`.  This sidesteps the TypeScript errors you reported
 * while keeping the runtime behaviour identical.
 */

export default function DeepWork() {
  const [blockedWebsites, setBlockedWebsites] = useState<BlockedWebsite[]>([])
  const [newWebsite, setNewWebsite]           = useState('')
  const [blockedApps, setBlockedApps]         = useState<string[]>([])
  const [newApp, setNewApp]                   = useState('')
  const [activeTab, setActiveTab]             = useState<'websites' | 'apps'>('websites')

  /* lock‑down state */
  const [deepWorkActive, setDeepWorkActive]   = useState(false)

  /* ─────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false

    /* 1. load list of blocked sites */
    getBlockedWebsites().then(ws => { if (!cancelled) setBlockedWebsites(ws) })

    /* 2. wire up IPC listeners — but ONLY if the bridge exists */
    const api: any = (window as any).electronAPI
    if (!api) return                      // running in plain browser / dev‑tools

    const handler = (state: boolean) => !cancelled && setDeepWorkActive(state)
    api.onDeepWorkState?.(handler)        // <- optional‑chained & type‑cast

    /* ask once on mount */
    api.requestDeepWorkState?.()
       ?.then((state: boolean) => { if (!cancelled) setDeepWorkActive(state) })
       ?.catch(console.error)

    return () => {
      cancelled = true
      api.removeAllListeners?.()
    }
  }, [])
  /* ─────────────────────────────────────────────── */

  /* helpers */
  const addItem = async (tab: 'websites' | 'apps') => {
    if (tab === 'websites' && newWebsite.trim()) {
      try {
        const inserted = await addBlockedWebsite(newWebsite.trim())
        setBlockedWebsites(ws => [...ws, inserted])
        setNewWebsite('')
      } catch (err: any) {
        console.error(err)
        alert('Failed to save blocked site:\n' + err.message)
      }
    }
    if (tab === 'apps' && newApp.trim()) {
      setBlockedApps(as => [...as, newApp.trim()])
      setNewApp('')
      // TODO: persist to DB when ready
    }
  }

  const removeItem = async (tab: 'websites' | 'apps', item: BlockedWebsite | string) => {
    if (tab === 'websites') {
      await removeBlockedWebsite((item as BlockedWebsite).id)
      setBlockedWebsites(ws => ws.filter(w => w.id !== (item as BlockedWebsite).id))
    } else {
      setBlockedApps(as => as.filter(a => a !== item))
    }
  }

  /* deep‑work toggles (type‑cast) */
  const startDeepWork = () => (window as any).electronAPI?.startDeepWork?.()
  const stopDeepWork  = () => (window as any).electronAPI?.stopDeepWork?.()

  /* ─────────────────────────────────────────────── */
  return (
    <div className="bg-[#181414] min-h-screen p-6 md:p-12 flex flex-col items-center">
      {/* Lock‑down toggle ----------------------------------------------------- */}
      <div className="w-full max-w-4xl mb-8 flex justify-center">
        {deepWorkActive ? (
          <button
            onClick={stopDeepWork}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition"
          >
            Cancel Deep‑Work Lock‑down
          </button>
        ) : (
          <button
            onClick={startDeepWork}
            className="px-6 py-3 bg-[#1B3B29] hover:bg-[#152b1f] rounded-lg text-white font-semibold transition"
          >
            Start Deep‑Work Lock‑down
          </button>
        )}
      </div>

      {/* Tabs ----------------------------------------------------------------- */}
      <div className="w-full max-w-4xl mb-8">
        <nav className="flex border-b border-gray-700 bg-[#242424] rounded-t-lg shadow">
          {['websites','apps'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-3 text-center font-medium ${
                activeTab === tab
                  ? 'border-b-2 border-[#1B3B29] text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab==='websites' ? 'Websites' : 'Desktop Apps'}
            </button>
          ))}
        </nav>
      </div>

      {/* Content -------------------------------------------------------------- */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Websites ----------------------------------------------------------- */}
        <div className={`bg-[#242424] p-6 rounded-b-lg shadow-lg transition-opacity ${
            activeTab !== 'websites' && 'opacity-50 pointer-events-none'
          }`}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
            Block Websites <span className="ml-2 text-sm text-gray-400">
              ({blockedWebsites.length})
            </span>
          </h2>

          {blockedWebsites.length === 0 ? (
            <p className="italic text-gray-400 mb-4">No websites blocked</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {blockedWebsites.map(site => (
                <li
                  key={site.id}
                  className="flex items-center justify-between bg-[#333333] p-2 rounded-lg"
                >
                  <span className="truncate text-white">{site.url}</span>
                  <button
                    onClick={() => removeItem('websites', site)}
                    className="p-1 hover:bg-[#3a2a2a] rounded"
                    aria-label="Remove website"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg"
                         className="h-4 w-4 text-red-500"
                         fill="none" viewBox="0 0 24 24"
                         stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter URL…"
              value={newWebsite}
              onChange={e => setNewWebsite(e.target.value)}
              onKeyDown={e => e.key==='Enter' && addItem('websites')}
              className="flex-1 border border-gray-700 rounded-lg p-2 bg-[#333333] text-white
                         focus:outline-none focus:ring-2 focus:ring-[#1B3B29]"
            />
            <button
              onClick={() => addItem('websites')}
              disabled={!newWebsite.trim()}
              className="flex items-center gap-1 bg-[#1B3B29] text-white px-4 rounded-lg
                         disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#152b1f]"
            >
              <svg xmlns="http://www.w3.org/2000/svg"
                   className="h-5 w-5" viewBox="0 0 20 20"
                   fill="currentColor">
                <path fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0
                         11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"/>
              </svg>
              Add
            </button>
          </div>
        </div>

        {/* Desktop Apps ------------------------------------------------------- */}
        <div className={`bg-[#242424] p-6 rounded-b-lg shadow-lg transition-opacity ${
            activeTab !== 'apps' && 'opacity-50 pointer-events-none'
          }`}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
            Block Desktop Apps
            <span className="ml-2 text-sm text-gray-400">
              ({blockedApps.length})
            </span>
          </h2>

          {blockedApps.length === 0 ? (
            <p className="italic text-gray-400 mb-4">No apps blocked</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {blockedApps.map((app, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between bg-[#333333] p-2 rounded-lg"
                >
                  <span className="truncate text-white">{app}</span>
                  <button
                    onClick={() => removeItem('apps', app)}
                    className="p-1 hover:bg-[#3a2a2a] rounded"
                    aria-label="Remove app"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg"
                         className="h-4 w-4 text-red-500"
                         fill="none" viewBox="0 0 24 24"
                         stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter App process…"
              value={newApp}
              onChange={e => setNewApp(e.target.value)}
              onKeyDown={e => e.key==='Enter' && addItem('apps')}
              className="flex-1 border border-gray-700 rounded-lg p-2 bg-[#333333] text-white
                         focus:outline-none focus:ring-2 focus:ring-[#1B3B29]"
            />
            <button
              onClick={() => addItem('apps')}
              disabled={!newApp.trim()}
              className="flex items-center gap-1 bg-[#1B3B29] text-white px-4 rounded-lg
                         disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#152b1f]"
            >
              <svg xmlns="http://www.w3.org/2000/svg"
                   className="h-5 w-5" viewBox="0 0 20 20"
                   fill="currentColor">
                <path fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0
                         11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"/>
              </svg>
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
