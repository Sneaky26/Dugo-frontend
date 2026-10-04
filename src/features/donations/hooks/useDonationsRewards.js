import { useCallback, useMemo, useState } from 'react'
import data, {
  buildBatchPreview,
  buildDonorOptions,
  buildPointsPreview,
  deferralSummary,
  evaluateScreening,
  FLOW_STEPS,
  nextDonationId,
  NOW_DAY,
  unitsFor,
} from '../donations-rewards-data.js'

const { DONATION_SITES, DONATION_STAFF } = data

const TODAY = NOW_DAY

const EMPTY_FORM = {
  type: 'whole-blood',
  donorId: '',
  linkedRequest: '',
  hemoglobin: '',
  systolic: '',
  diastolic: '',
  deferralReason: 'low-hemoglobin',
  deferralPeriod: '3-months',
  site: DONATION_SITES[0],
  recordedBy: DONATION_STAFF[0],
}

const EMPTY_REWARD = { name: '', points: '', stock: '' }

/*
  Session state for the Donations & Rewards tab pair.

  Everything written here is deliberately local to the session, in the same way
  the inventory ledger's add-units write is: a confirmed donation, a deferral, a
  redemption decision and a catalog edit all stay on screen until a reload, and
  none of them rewrites the donor registry. In particular approving a redemption
  does not touch donor.points — the leaderboard keeps reading the registry, so the
  two tabs can never quietly disagree about a balance.

  The one write that leaves this feature is the inventory batch created by the
  confirmation step, and that goes through the callback the shell passes in.
*/
export function useDonationsRewards() {
  const [addedDonations, setAddedDonations] = useState([])
  const [deferrals, setDeferrals] = useState([])
  const [batchIds, setBatchIds] = useState({})
  const [redemptionStatus, setRedemptionStatus] = useState({})
  const [rewards, setRewards] = useState(data.REWARDS)
  const [rewardFormOpen, setRewardFormOpen] = useState(false)
  const [rewardDraft, setRewardDraft] = useState(EMPTY_REWARD)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(EMPTY_FORM)

  const donations = useMemo(() => [...addedDonations, ...data.DONATIONS], [addedDonations])
  const donorOptions = useMemo(() => buildDonorOptions(form.type, donations), [form.type, donations])
  const screening = useMemo(
    () => evaluateScreening({ hemoglobin: form.hemoglobin, systolic: form.systolic, diastolic: form.diastolic }),
    [form.hemoglobin, form.systolic, form.diastolic],
  )
  const points = useMemo(
    () => (form.donorId === '' ? null : buildPointsPreview(form.donorId, form.type)),
    [form.donorId, form.type],
  )
  const deferral = useMemo(
    () => deferralSummary(form.deferralReason, form.deferralPeriod),
    [form.deferralReason, form.deferralPeriod],
  )
  const nextId = useMemo(() => nextDonationId(addedDonations), [addedDonations])

  /* A batch id can only be previewed before the shell has written it, so the
     preview reads the ids minted in this session and falls back to what
     inventory-data.js would hand out next. */
  const batchPreview = useMemo(
    () =>
      form.donorId === ''
        ? null
        : buildBatchPreview(nextId, form.donorId, form.type, TODAY, Object.values(batchIds).map((batch) => ({ batch }))),
    [batchIds, form.donorId, form.type, nextId],
  )

  const selectedDonor = useMemo(
    () => donorOptions.find((option) => option.donorId === form.donorId) ?? null,
    [donorOptions, form.donorId],
  )

  const updateForm = useCallback((patch) => setForm((current) => ({ ...current, ...patch })), [])

  const openConfirm = useCallback((type = 'whole-blood') => {
    setForm({ ...EMPTY_FORM, type })
    setStep(1)
    setConfirmOpen(true)
  }, [])

  const closeConfirm = useCallback(() => setConfirmOpen(false), [])

  const goToStep = useCallback(
    (next) => setStep(Math.min(FLOW_STEPS.length, Math.max(1, next))),
    [],
  )

  /* Writes one ledger row and returns it. The batch itself is created by the
     caller's inventory callback, and attachBatch() records the id it produced. */
  const recordDonation = useCallback(() => {
    const row = {
      id: nextDonationId(addedDonations),
      donorId: form.donorId,
      type: form.type,
      units: unitsFor(form.type),
      date: TODAY,
      linkedRequest: form.linkedRequest === '' ? null : form.linkedRequest,
      recordedBy: form.recordedBy,
      site: form.site,
    }
    setAddedDonations((current) => [row, ...current])
    return row
  }, [addedDonations, form])

  const attachBatch = useCallback((donationId, batch) => {
    if (!batch) return
    setBatchIds((current) => ({ ...current, [donationId]: batch }))
  }, [])

  const recordDeferral = useCallback(() => {
    const entry = {
      id: `deferral-${form.donorId}-${deferrals.length + 1}`,
      donorId: form.donorId,
      reason: deferral.reasonLabel,
      period: deferral.periodLabel,
      since: TODAY,
      until: deferral.nextEligible,
    }
    setDeferrals((current) => [entry, ...current])
    return entry
  }, [deferrals.length, deferral, form.donorId])

  const decideRedemption = useCallback((redemptionId, status) => {
    setRedemptionStatus((current) => ({ ...current, [redemptionId]: status }))
  }, [])

  const openRewardForm = useCallback(() => {
    setRewardDraft(EMPTY_REWARD)
    setRewardFormOpen(true)
  }, [])

  const closeRewardForm = useCallback(() => setRewardFormOpen(false), [])

  const updateRewardDraft = useCallback((patch) => setRewardDraft((current) => ({ ...current, ...patch })), [])

  const saveReward = useCallback(() => {
    const name = rewardDraft.name.trim()
    const points = Number(rewardDraft.points)
    const stock = Number(rewardDraft.stock)
    if (name === '' || !Number.isFinite(points) || !Number.isFinite(stock)) return null

    const reward = {
      id: `reward-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
      name,
      points,
      stock,
      active: true,
    }
    setRewards((current) => [...current, reward])
    setRewardDraft(EMPTY_REWARD)
    setRewardFormOpen(false)
    return reward
  }, [rewardDraft])

  const toggleReward = useCallback((rewardId) => {
    setRewards((current) =>
      current.map((reward) => (reward.id === rewardId ? { ...reward, active: !reward.active } : reward)),
    )
  }, [])

  const reset = useCallback(() => {
    setAddedDonations([])
    setDeferrals([])
    setBatchIds({})
    setRedemptionStatus({})
    setRewards(data.REWARDS)
    setRewardFormOpen(false)
    setRewardDraft(EMPTY_REWARD)
    setConfirmOpen(false)
    setStep(1)
    setForm(EMPTY_FORM)
  }, [])

  return {
    donations,
    addedDonations,
    deferrals,
    batchIds,
    rewards,
    redemptionStatus,
    rewardFormOpen,
    rewardDraft,
    confirmOpen,
    step,
    form,
    donorOptions,
    selectedDonor,
    screening,
    points,
    deferral,
    batchPreview,
    nextId,
    updateForm,
    openConfirm,
    closeConfirm,
    goToStep,
    recordDonation,
    attachBatch,
    recordDeferral,
    decideRedemption,
    openRewardForm,
    closeRewardForm,
    updateRewardDraft,
    saveReward,
    toggleReward,
    reset,
  }
}

export default useDonationsRewards