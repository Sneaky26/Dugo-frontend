/* Pagination math, kept separate from the screen so it can be checked directly. */

export function paginate(items, page, pageSize) {
  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(Math.max(1, page), pageCount)
  const firstRow = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const lastRow = Math.min(currentPage * pageSize, total)

  return {
    rows: items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    pageCount,
    currentPage,
    firstRow,
    lastRow,
    total,
  }
}

export default paginate