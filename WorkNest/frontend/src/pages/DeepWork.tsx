// src/pages/DeepWork.tsx
import React, { useState } from 'react'

export default function DeepWork() {
  const [blockedWebsites, setBlockedWebsites] = useState<string[]>([
    'facebook.com',
    'twitter.com',
    'youtube.com',
  ])
  const [newWebsite, setNewWebsite] = useState('')

  const [blockedApps, setBlockedApps] = useState<string[]>([
    'Steam.exe',
    'Slack.exe',
  ])
  const [newApp, setNewApp] = useState('')

  const [activeTab, setActiveTab] = useState<'websites' | 'apps'>('websites')

  const addItem = (tab: 'websites' | 'apps') => {
    if (tab === 'websites' && newWebsite.trim()) {
      setBlockedWebsites(ws => [...ws, newWebsite.trim()])
      setNewWebsite('')
    }
    if (tab === 'apps' && newApp.trim()) {
      setBlockedApps(as => [...as, newApp.trim()])
      setNewApp('')
    }
  }

  const removeItem = (tab: 'websites' | 'apps', item: string) => {
    if (tab === 'websites') setBlockedWebsites(ws => ws.filter(u => u !== item))
    else setBlockedApps(as => as.filter(a => a !== item))
  }

  return (
    <div className="bg-[#F7F5EF] min-h-screen p-6 md:p-12 flex flex-col items-center">
      {/* Tabs */}
      <div className="w-full max-w-4xl mb-8">
        <nav className="flex border-b bg-white rounded-t-lg shadow">
          {['websites', 'apps'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-3 text-center font-medium 
                ${activeTab === tab
                  ? 'border-b-2 border-[#1B3B29] text-[#1B3B29]'
                  : 'text-[#70757A] hover:text-[#1B3B29]'}
              `}
            >
              {tab === 'websites' ? 'Websites' : 'Desktop Apps'}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Website Blocks */}
        <div
          className={`bg-white p-6 rounded-b-lg shadow-lg transition-opacity
            ${activeTab !== 'websites' && 'opacity-50 pointer-events-none'}`}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            Block Websites
            <span className="ml-2 text-sm text-[#70757A]">
              ({blockedWebsites.length})
            </span>
          </h2>
          {blockedWebsites.length === 0 ? (
            <p className="italic text-[#70757A] mb-4">No websites blocked</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {blockedWebsites.map((url, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between bg-[#F1F1F1] p-2 rounded-lg"
                >
                  <span className="truncate">{url}</span>
                  <button
                    onClick={() => removeItem('websites', url)}
                    className="p-1 hover:bg-red-100 rounded"
                    aria-label="Remove website"
                  >
                    {/* X icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
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
              onKeyDown={e => e.key === 'Enter' && addItem('websites')}
              className="flex-1 border border-[#D1D5DB] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#1B3B29]"
            />
            <button
              onClick={() => addItem('websites')}
              disabled={!newWebsite.trim()}
              className="flex items-center gap-1 bg-[#1B3B29] text-white px-4 rounded-lg
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Plus icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 
                     0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add
            </button>
          </div>
        </div>

        {/* App Blocks */}
        <div
          className={`bg-white p-6 rounded-b-lg shadow-lg transition-opacity
            ${activeTab !== 'apps' && 'opacity-50 pointer-events-none'}`}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            Block Desktop Apps
            <span className="ml-2 text-sm text-[#70757A]">
              ({blockedApps.length})
            </span>
          </h2>
          {blockedApps.length === 0 ? (
            <p className="italic text-[#70757A] mb-4">No apps blocked</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {blockedApps.map((app, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between bg-[#F1F1F1] p-2 rounded-lg"
                >
                  <span className="truncate">{app}</span>
                  <button
                    onClick={() => removeItem('apps', app)}
                    className="p-1 hover:bg-red-100 rounded"
                    aria-label="Remove app"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
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
              onKeyDown={e => e.key === 'Enter' && addItem('apps')}
              className="flex-1 border border-[#D1D5DB] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#1B3B29]"
            />
            <button
              onClick={() => addItem('apps')}
              disabled={!newApp.trim()}
              className="flex items-center gap-1 bg-[#1B3B29] text-white px-4 rounded-lg
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 
                     0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
