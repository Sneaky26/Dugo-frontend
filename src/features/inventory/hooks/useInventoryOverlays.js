import { useCallback, useMemo, useState } from 'react'
import inventoryData, {
  buildBatchDetail,
  buildIssueSlip,
  buildProcessOutputs,
  nextBatchId,
  resolveBatches,
} from '../inventory-data.js'

const { expiryFromCollection, requestById } = inventoryData

export function nextBatchIds(count, added) {
  const ids = []
  let pool = added
  while (ids.length < count) {
    const id = nextBatchId(pool)
    ids.push(id)
    pool = [...pool, { batch: id }]
  }
  return ids
}

export function useInventoryOverlays() {
  const [addOpen, setAddOpen] = useState(false)
  const [batchDetailId, setBatchDetailId] = useState(null)
  const [discardId, setDiscardId] = useState(null)
  const [selectedBatchId, setSelectedBatchId] = useState(null)
  const [overrides, setOverrides] = useState({})
  const [added, setAdded] = useState([])

  const batches = useMemo(() => resolveBatches(overrides, added), [overrides, added])

  const openAdd = useCallback(() => setAddOpen(true), [])
  const closeAdd = useCallback(() => setAddOpen(false), [])
  const openBatch = useCallback((batchId) => setBatchDetailId(batchId), [])
  const closeBatch = useCallback(() => setBatchDetailId(null), [])
  const openDiscard = useCallback((batchId) => setDiscardId(batchId), [])
  const closeDiscard = useCallback(() => setDiscardId(null), [])
  const selectBatch = useCallback((batchId) => setSelectedBatchId(batchId), [])
  const clearSelection = useCallback(() => setSelectedBatchId(null), [])

  /* reservedFor is set when a collection is earmarked for an open request from
     the confirmation flow; the add-units drawer never reserves, so it keeps
     passing nothing and the batch lands unreserved. */
  const addUnits = useCallback(
    ({ bloodType, component, units, collected, source, status = 'Quarantine', reservedFor = null }) => {
      const batch = {
        batch: nextBatchId(added),
        bloodType,
        component,
        units,
        collected,
        expiry: expiryFromCollection(collected, component),
        source,
        status,
        reservedFor,
      }
      setAdded((current) => [batch, ...current])
      setSelectedBatchId(batch.batch)
      setAddOpen(false)
      return batch
    },
    [added],
  )

  const issueUnits = useCallback(
    ({ requestId, selections }) => {
      const slip = buildIssueSlip(requestById(requestId), selections, batches)

      setOverrides((current) => {
        const next = { ...current }
        for (const selection of selections) {
          const batch = batches.find((row) => row.batch === selection.batch)
          if (!batch) continue
          const remaining = batch.units - selection.units
          if (remaining > 0) next[selection.batch] = { units: remaining }
          else next[selection.batch] = { status: 'Issued', reservedFor: requestId }
        }
        return next
      })
      setSelectedBatchId(null)
      return slip
    },
    [batches],
  )

  /*
    The five stock statuses the brief fixes are Quarantine / Available / Reserved /
    Issued / Expired, and none of them means "destroyed". Discarded stock is filed
    under Expired so it leaves the on-hand counts, and the reason the operator picked
    is kept on the row so the audit trail still explains itself.
  */
  const discardBatch = useCallback((batchId, reason) => {
    setOverrides((current) => ({ ...current, [batchId]: { status: 'Expired', discardReason: reason } }))
    setDiscardId(null)
    setSelectedBatchId((current) => (current === batchId ? null : current))
  }, [])

  const processUnit = useCallback(
    (batchId) => {
      const outputs = buildProcessOutputs(batchId)
      if (outputs.length === 0) return []
      const [rbcId, plasmaId, cryoId] = nextBatchIds(outputs.length, added)
      const parent = batches.find((row) => row.batch === batchId)
      const created = [
        { ...outputs[0], batch: rbcId },
        { ...outputs[1], batch: plasmaId },
        { ...outputs[2], batch: cryoId },
      ].map((row) => ({ ...row, source: parent ? `PROC-${parent.batch}` : 'PROC' }))

      setOverrides((current) => ({
        ...current,
        [batchId]: { status: 'Issued', processedInto: created.map((row) => row.batch) },
      }))
      setAdded((current) => [...created, ...current])
      setSelectedBatchId((current) => (current === batchId ? null : current))
      return created
    },
    [added, batches],
  )

  const reset = useCallback(() => {
    setOverrides({})
    setAdded([])
    setSelectedBatchId(null)
    setBatchDetailId(null)
    setDiscardId(null)
    setAddOpen(false)
  }, [])

  const detail = batchDetailId ? buildBatchDetail(batchDetailId, batches) : null

  return {
    addOpen,
    batchDetailId,
    discardId,
    selectedBatchId,
    added,
    overrides,
    batches,
    detail,
    openAdd,
    closeAdd,
    openBatch,
    closeBatch,
    openDiscard,
    closeDiscard,
    selectBatch,
    clearSelection,
    addUnits,
    issueUnits,
    discardBatch,
    processUnit,
    reset,
  }
}