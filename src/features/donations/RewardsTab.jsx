/* ============================================================================
 * REWARDS TAB — ID MAP
 * ----------------------------------------------------------------------------
 * #rewards-rules                 read-only points rules
 *   #rewards-rules-type-whole-blood | -platelets | -plasma
 *   #rewards-rules-referral       the +50 referral bonus at six donations
 *   #rewards-rules-settings       link to #nav-settings
 * #rewards-leaderboard           top ten donors by balance
 *   #rewards-leaderboard-row-D-1729  rank, name, blood type, points
 * #rewards-catalog               reward cards
 *   #rewards-card-t-shirt         #rewards-card-<id>-toggle
 *   #rewards-add-btn              opens #rewards-add-form
 * #rewards-add-form              #rewards-add-name -points -stock
 *                               #rewards-add-save-btn -cancel-btn
 * #rewards-redemptions           redemption requests
 *   #rewards-redemption-row-RDM-0001  data-status
 *     #rewards-redemption-row-RDM-0001-approve-btn
 *     #rewards-redemption-row-RDM-0001-reject-btn
 * ==========================================================================*/

import data, { buildLeaderboard, buildRedemptions, buildRewards, buildRules } from './donations-rewards-data.js'

const { REWARD_RULES, REDEMPTION_STATUSES } = data

function Rules() {
  const rules = buildRules()

  return (
    <div id="rewards-rules" className="card">
      <div className="row row-between">
        <h2>Points rules</h2>
        <a id="rewards-rules-settings" href="#nav-settings">
          Edit in Settings
        </a>
      </div>
      <table>
        <thead>
          <tr>
            <th scope="col">Donation type</th>
            <th scope="col">Points</th>
            <th scope="col">Interval</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr key={rule.id} id={rule.id} data-type={rule.type}>
              <td>{rule.label}</td>
              <td data-points={rule.points}>{rule.points}</td>
              <td>{rule.intervalDays} days</td>
            </tr>
          ))}
          <tr id="rewards-rules-referral" data-type="referral">
            <td>{REWARD_RULES.referralBonus.label}</td>
            <td data-points={REWARD_RULES.referralBonus.points}>+{REWARD_RULES.referralBonus.points}</td>
            <td>at {REWARD_RULES.referralBonus.threshold} donations</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function Leaderboard() {
  const rows = buildLeaderboard()

  return (
    <div id="rewards-leaderboard" className="card">
      <h2>Leaderboard</h2>
      <div className="chart-box">
        <span>[chart]</span>
        <span>Top donors by points balance</span>
      </div>
      <table>
        <thead>
          <tr>
            <th scope="col">Rank</th>
            <th scope="col">Donor</th>
            <th scope="col">Blood type</th>
            <th scope="col">Points</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} id={row.id} data-rank={row.rank} data-blood-type={row.bloodType}>
              <td>{row.rank}</td>
              <td>
                {row.name} <span className="muted">{row.donorId}</span>
              </td>
              <td data-blood-type={row.bloodType}>{row.bloodType}</td>
              <td data-points={row.points}>{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Catalog({ rewards, rewardFormOpen, rewardDraft, onOpenForm, onCloseForm, onDraft, onSave, onToggle }) {
  const cards = buildRewards(rewards)

  return (
    <div id="rewards-catalog" className="card">
      <div className="row row-between">
        <h2>Rewards catalog</h2>
        <button id="rewards-add-btn" className="btn" type="button" onClick={onOpenForm}>
          <span>[icon]</span>
          <span>Add reward</span>
        </button>
      </div>

      {rewardFormOpen ? (
        <form
          id="rewards-add-form"
          className="row"
          onSubmit={(event) => {
            event.preventDefault()
            onSave()
          }}
        >
          <div className="field">
            <label>
              <span>Name</span>
              <input id="rewards-add-name" value={rewardDraft.name} onChange={(event) => onDraft({ name: event.target.value })} />
            </label>
          </div>
          <div className="field">
            <label>
              <span>Points cost</span>
              <input
                id="rewards-add-points"
                type="number"
                value={rewardDraft.points}
                onChange={(event) => onDraft({ points: event.target.value })}
              />
            </label>
          </div>
          <div className="field">
            <label>
              <span>Stock</span>
              <input
                id="rewards-add-stock"
                type="number"
                value={rewardDraft.stock}
                onChange={(event) => onDraft({ stock: event.target.value })}
              />
            </label>
          </div>
          <button id="rewards-add-save-btn" className="btn" type="submit">
            Save reward
          </button>
          <button id="rewards-add-cancel-btn" className="btn" type="button" onClick={onCloseForm}>
            Cancel
          </button>
        </form>
      ) : null}

      <div id="rewards-cards">
        {cards.map((reward) => (
          <div
            key={reward.id}
            id={reward.cardId}
            className="card"
            data-reward={reward.id}
            data-active={reward.active}
            data-available={reward.available}
            data-points={reward.points}
          >
            <span id={`${reward.cardId}-name`}>{reward.name}</span>
            <span id={`${reward.cardId}-cost`}>{reward.points} pts</span>
            <span id={`${reward.cardId}-stock`} data-stock={reward.stock}>
              {reward.stock === 0 ? 'Out of stock' : `${reward.stock} in stock`}
            </span>
            <button
              id={`${reward.cardId}-toggle`}
              className="btn"
              type="button"
              data-active={reward.active}
              onClick={() => onToggle(reward.id)}
            >
              {reward.active ? 'Retire' : 'Reinstate'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function Redemptions({ redemptions, onDecide }) {
  const rows = buildRedemptions(redemptions)

  return (
    <div id="rewards-redemptions" className="card">
      <h2>Redemption requests</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Redemption</th>
            <th scope="col">Donor</th>
            <th scope="col">Reward</th>
            <th scope="col">Points</th>
            <th scope="col">Balance</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              id={row.rowId}
              data-redemption={row.id}
              data-status={row.status}
              data-affordable={row.affordable}
              data-reward-active={row.rewardActive}
            >
              <td>{row.id}</td>
              <td>
                {row.donorName} <span className="muted">{row.donorId}</span>
              </td>
              <td data-reward-active={row.rewardActive}>
                {row.rewardName}
                {row.rewardActive ? '' : ' (retired)'}
              </td>
              <td data-points={row.points}>{row.points}</td>
              <td data-balance={row.balance} data-shortfall={row.shortfall}>
                {row.balance}
              </td>
              <td>{REDEMPTION_STATUSES.find((status) => status.value === row.status)?.label}</td>
              <td>
                <button
                  id={`${row.rowId}-approve-btn`}
                  className="btn"
                  type="button"
                  disabled={row.status === 'approved'}
                  onClick={() => onDecide(row.id, 'approved')}
                >
                  Approve
                </button>
                <button
                  id={`${row.rowId}-reject-btn`}
                  className="btn"
                  type="button"
                  disabled={row.status === 'rejected'}
                  onClick={() => onDecide(row.id, 'rejected')}
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p id="rewards-redemptions-note" className="muted">
        Approving a request does not change the donor balance on this screen — it stays as the registry
        recorded it until the next import.
      </p>
    </div>
  )
}

export default function RewardsTab({ state }) {
  const {
    rewards,
    redemptionStatus,
    rewardFormOpen,
    rewardDraft,
    openRewardForm,
    closeRewardForm,
    updateRewardDraft,
    saveReward,
    toggleReward,
    decideRedemption,
  } = state

  /* Session decisions are layered over the fixture rows rather than rewriting
     the fixture, so a reload restores the original statuses. */
  const redemptions = Object.entries(redemptionStatus).reduce(
    (rows, [redemptionId, status]) =>
      rows.map((row) => (row.id === redemptionId ? { ...row, status, decision: status === 'pending' ? null : row.decision } : row)),
    data.REDEMPTIONS,
  )

  return (
    <section id="rewards-panel">
      <Rules />

      <Leaderboard />

      <Catalog
        rewards={rewards}
        rewardFormOpen={rewardFormOpen}
        rewardDraft={rewardDraft}
        onOpenForm={openRewardForm}
        onCloseForm={closeRewardForm}
        onDraft={updateRewardDraft}
        onSave={saveReward}
        onToggle={toggleReward}
      />

      <Redemptions redemptions={redemptions} onDecide={decideRedemption} />
    </section>
  )
}