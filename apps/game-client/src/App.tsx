import { useCallback, useEffect, useState } from 'react'
import { GameShell } from './app/GameShell'
import { IdentityPage } from './pages/game/identity-page'
import { GamePage } from './pages/game/game-page'
import { SaveStartPage } from './pages/game/save-start-page'
import { StoryPackSelectPage } from './pages/game/story-pack-select-page'
import { loadContentPack, loadContentPackManifest, type ContentPackManifest, type ContentPackManifestEntry } from './store/content-loader'
import { initializeGameStore, useGameStore } from './store/game-store'

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function App() {
  const [manifest, setManifest] = useState<ContentPackManifest>()
  const [manifestError, setManifestError] = useState<string>()
  const [loadingPackId, setLoadingPackId] = useState<string>()
  const [packLoadError, setPackLoadError] = useState<string>()
  const [selectedPackId, setSelectedPackId] = useState<string>()
  const [saveStartRequired, setSaveStartRequired] = useState(false)
  const [saveStartCanResume, setSaveStartCanResume] = useState(false)
  const [saveStartError, setSaveStartError] = useState<string>()
  const runtime = useGameStore((state) => state.runtime)
  const hasSavedGame = useGameStore((state) => state.hasSavedGame)
  const loadSavedGame = useGameStore((state) => state.loadSavedGame)
  const resetGame = useGameStore((state) => state.resetGame)

  useEffect(() => {
    let cancelled = false

    loadContentPackManifest()
      .then((nextManifest) => {
        if (cancelled) return
        setManifest(nextManifest)
        setManifestError(undefined)
      })
      .catch((error) => {
        if (cancelled) return
        setManifestError(getErrorMessage(error, '故事列表加载失败'))
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleSelectPack = useCallback(async (pack: ContentPackManifestEntry) => {
    setLoadingPackId(pack.packId)
    setPackLoadError(undefined)
    try {
      const contentPack = await loadContentPack(pack)
      initializeGameStore(contentPack)
      const canResume = hasSavedGame()
      const saveError = useGameStore.getState().lastError
      setSaveStartCanResume(canResume)
      setSaveStartError(saveError)
      setSaveStartRequired(canResume || Boolean(saveError))
      setSelectedPackId(pack.packId)
    } catch (error) {
      setPackLoadError(getErrorMessage(error, '故事包加载失败'))
    } finally {
      setLoadingPackId(undefined)
    }
  }, [hasSavedGame])

  const handleResumeSave = useCallback(() => {
    if (loadSavedGame()) {
      setSaveStartRequired(false)
      setSaveStartError(undefined)
    } else {
      setSaveStartCanResume(false)
      setSaveStartError(useGameStore.getState().lastError)
    }
  }, [loadSavedGame])

  const handleStartNewGame = useCallback(() => {
    resetGame()
    setSaveStartRequired(false)
    setSaveStartCanResume(false)
    setSaveStartError(undefined)
  }, [resetGame])

  if (manifestError) {
    return (
      <main className="story-pack-select-page" data-test-id="story-pack-manifest-error-page">
        <div className="story-pack-select-inner" data-test-id="story-pack-manifest-error-inner">
          <div className="story-pack-select-error" role="alert" data-test-id="story-pack-manifest-error">
            <strong data-test-id="story-pack-manifest-error-title">故事列表加载失败</strong>
            <span data-test-id="story-pack-manifest-error-message">{manifestError}</span>
          </div>
        </div>
      </main>
    )
  }

  if (!manifest) {
    return (
      <main className="story-pack-select-page" data-test-id="story-pack-manifest-loading-page">
        <div className="story-pack-select-inner" data-test-id="story-pack-manifest-loading-inner">
          <p className="story-pack-select-loading" data-test-id="story-pack-manifest-loading-message">正在载入故事列表</p>
        </div>
      </main>
    )
  }

  if (!selectedPackId) {
    return (
      <StoryPackSelectPage
        packs={manifest.packs}
        loadingPackId={loadingPackId}
        error={packLoadError}
        onSelectPack={handleSelectPack}
      />
    )
  }

  return (
    <div data-test-id="game-client-app">
      <GameShell>
        {saveStartRequired ? (
          <SaveStartPage
            canResume={saveStartCanResume}
            error={saveStartError}
            onResume={handleResumeSave}
            onNewGame={handleStartNewGame}
          />
        ) : runtime ? <GamePage /> : <IdentityPage />}
      </GameShell>
    </div>
  )
}
