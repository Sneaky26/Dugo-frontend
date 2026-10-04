import RequestCancelModal from '../screens/RequestCancelModal.jsx'

/* Requests list and Request Detail share #nav-requests, so a nav id alone
   cannot identify the overlay. The shell resolves which one the current view
   needs and renders it into #overlay-root. */
const SCREEN_OVERLAYS = {
  'nav-requests': RequestCancelModal,
}

export default SCREEN_OVERLAYS