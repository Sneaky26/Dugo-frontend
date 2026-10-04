import { useState } from 'react'

const EMPTY = {
  drawerOpen: false,
  drawerDonorId: null,
  importOpen: false,
  revealOpen: false,
  revealDonorId: null,
  revealReason: '',
  revealNotes: '',
  revealedReason: '',
}

export function useDonorsOverlays() {
  const [state, setState] = useState(EMPTY)

  function openDrawer(donorId = null) {
    setState((current) => ({ ...current, drawerOpen: true, drawerDonorId: donorId }))
  }

  function closeDrawer() {
    setState((current) => ({ ...current, drawerOpen: false, drawerDonorId: null }))
  }

  function openImport() {
    setState((current) => ({ ...current, importOpen: true }))
  }

  function closeImport() {
    setState((current) => ({ ...current, importOpen: false }))
  }

  function openReveal(donorId) {
    setState((current) => ({ ...current, revealOpen: true, revealDonorId: donorId }))
  }

  function closeReveal() {
    setState((current) => ({ ...current, revealOpen: false, revealDonorId: null }))
  }

  function confirmReveal({ donorId, reason, notes }) {
    setState((current) => ({
      ...current,
      revealOpen: false,
      revealDonorId: null,
      revealReason: reason,
      revealNotes: notes,
      /* Only the confirmed donor's contact stays unmasked. */
      revealedReason: donorId === current.revealDonorId ? reason : current.revealedReason,
    }))
  }

  function reset() {
    setState(EMPTY)
  }

  return {
    ...state,
    openDrawer,
    closeDrawer,
    openImport,
    closeImport,
    openReveal,
    closeReveal,
    confirmReveal,
    reset,
  }
}

export default useDonorsOverlays