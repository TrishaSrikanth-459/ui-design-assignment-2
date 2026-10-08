'use strict';

// Each stable ID names an event, never its position in the timeline.
// invitationStatus is the only stored RSVP value for each event.
const assetRoot = 'https://raw.githubusercontent.com/silka-co/ui-design-course-assets/main/images/';
const startingEvents = [
  {
    id: 'studio-night', invitationStatus: 'invited',
    title: 'Studio Night Demo Party #4', host: 'Maya Chen',
    date: 'Wednesday, August 12, 2026', isoDate: '2026-08-12', month: 'AUG', day: '12',
    time: '6:30 PM – 9:00 PM EDT', location: 'Design Lab',
    address: '116th Street and Broadway, New York, NY 10027',
    image: assetRoot + 'fractal-party.png', imageAlt: 'Soft abstract color-field artwork for Studio Night Demo Party',
    description: 'Join us for pizza, conversation, and a fast showcase of the strange, useful, and delightful projects students have been making. Demos will be three minutes long. Bring something you’re proud of, something unfinished, or simply come to see what others are exploring.'
  },
  {
    id: 'creative-ai', invitationStatus: 'going',
    title: 'Campus Creative AI Forum', host: 'Jordan Lee, Priya Shah & Alex Kim',
    date: 'Thursday, August 13, 2026', isoDate: '2026-08-13', month: 'AUG', day: '13',
    time: '6:00 PM – 8:00 PM EDT', location: 'Innovation Space',
    address: 'Columbia University campus, New York, NY 10027',
    image: assetRoot + 'agentics.avif', imageAlt: 'Dark green poster reading Use agents effectively',
    description: 'Meet students exploring creative uses of AI. Share a project, discuss your process, and exchange ideas with the campus community.'
  },
  {
    id: 'friday-social', invitationStatus: 'invited',
    title: 'Friday Night Social', host: 'Campus Neighbors',
    date: 'Friday, August 14, 2026', isoDate: '2026-08-14', month: 'AUG', day: '14',
    time: '6:30 PM – 8:30 PM EDT', location: 'College Walk',
    address: 'College Walk, Columbia University, New York, NY 10027',
    image: assetRoot + 'mama-nyc.avif', imageAlt: 'Friday social artwork showing a person beside a colorful storefront',
    description: 'Take a break from the week and meet your campus neighbors. Join us for relaxed conversation and an evening together on College Walk.'
  }
];
let events = startingEvents.map(event => ({ ...event }));
const state = { selectedId: null, isPanelOpen: false };
let opener = null;
const findEvent = id => events.find(event => event.id === id);
const role = name => document.querySelector(`[data-role="${name}"]`);
const ui = {
  layer: document.querySelector('#invitation-details'),
  panel: document.querySelector('.invitation-panel'),
  close: document.querySelector('.panel-close'),
  background: [...document.body.children].filter(element => !element.classList.contains('invitation-layer')),
  cards: [...document.querySelectorAll('[data-event-id]')],
  accept: document.querySelector('[data-action="accept-invitation"]'),
  decline: document.querySelector('[data-action="decline-invitation"]'),
  title: document.querySelector('#invitation-title'),
  registration: document.querySelector('.invitation-registration'),
  going: document.querySelector('[data-state-view="going"]'),
  declined: document.querySelector('[data-state-view="declined"]')
};
const statusLabels = { invited: 'Invited', going: 'Going', declined: 'Declined' };

// RENDER: DOM updates derive from state; event wiring is at the end of this file.
function renderCards() {
  ui.cards.forEach(button => {
    const event = findEvent(button.dataset.eventId);
    const badge = document.querySelector(`[data-status-for="${event.id}"]`);
    badge.textContent = statusLabels[event.invitationStatus];
    badge.classList.toggle('is-going', event.invitationStatus === 'going');
    badge.classList.toggle('is-declined', event.invitationStatus === 'declined');
    button.setAttribute('aria-expanded', String(state.isPanelOpen && state.selectedId === event.id));
  });
}
function renderPanel(message = '') {
  const event = findEvent(state.selectedId);
  const empty = state.selectedId === null;
  role('empty-state').hidden = !empty;
  role('error-state').hidden = empty || Boolean(event);
  role('event-content').hidden = !event;
  role('visible-feedback').textContent = message;
  // This node stays mounted; aria-live announces changes without moving focus.
  role('invitation-announcement').textContent = message;
  if (!event) {
    ui.title.textContent = empty ? 'Choose an invitation' : 'Invitation unavailable';
    return;
  }
  ui.title.textContent = event.title;
  role('event-image').src = event.image;
  role('event-image').alt = event.imageAlt;
  role('event-host').textContent = 'By ' + event.host;
  role('date-tile').dateTime = event.isoDate;
  role('month').textContent = event.month;
  role('day').textContent = event.day;
  role('event-date').textContent = event.date;
  role('event-time').textContent = event.time;
  role('event-location').textContent = event.location;
  role('event-address').textContent = event.address;
  role('event-description').textContent = event.description;
  role('location-summary').textContent = event.location + ' · ' + event.address;
  role('host-summary').textContent = event.host;
  role('panel-status').textContent = statusLabels[event.invitationStatus];
  role('registration-title').textContent = event.invitationStatus === 'invited'
    ? 'You are invited by ' + event.host : 'Your invitation';
  role('registration-copy').textContent = event.invitationStatus === 'invited'
    ? 'We’d love to have you join us.' : 'Your response is saved for this visit.';
  ui.registration.dataset.invitationState = event.invitationStatus;
  ui.going.hidden = event.invitationStatus !== 'going';
  ui.declined.hidden = event.invitationStatus !== 'declined';
  // Keep both buttons mounted and focusable so the activated button retains focus.
  // aria-disabled is enforced by updateInvitation; repeated actions are harmless.
  ui.accept.setAttribute('aria-disabled', String(event.invitationStatus === 'going'));
  ui.decline.setAttribute('aria-disabled', String(event.invitationStatus === 'declined'));
}
function render(message = '') {
  renderCards();
  renderPanel(message);
}

// ACTION -> STATE -> RENDER.
function updateInvitation(nextStatus) {
  const event = findEvent(state.selectedId);
  if (!event) {
    renderPanel();
    return;
  }
  if (event.invitationStatus === nextStatus) return;
  if (nextStatus !== 'going' && nextStatus !== 'declined') return;
  event.invitationStatus = nextStatus;
  const message = nextStatus === 'going'
    ? `Invitation accepted. You are going to ${event.title}.`
    : `Invitation declined. You are not registered for ${event.title}.`;
  render(message);
}
function openInvitation(id, trigger) {
  state.selectedId = id;
  state.isPanelOpen = true;
  opener = trigger;
  render();
  ui.layer.hidden = false;
  ui.layer.inert = false;
  ui.layer.setAttribute('aria-hidden', 'false');
  ui.layer.classList.add('is-open');
  document.body.classList.add('has-dialog-open');
  ui.close.focus();
  ui.background.forEach(element => { element.inert = true; });
}
function closeInvitation() {
  if (!state.isPanelOpen) return;
  state.isPanelOpen = false;
  ui.background.forEach(element => { element.inert = false; });
  document.body.classList.remove('has-dialog-open');
  ui.layer.classList.remove('is-open');
  // Restore focus before hiding the focused dialog from the accessibility tree.
  if (opener && opener.isConnected) opener.focus();
  ui.layer.inert = true;
  ui.layer.hidden = true;
  ui.layer.setAttribute('aria-hidden', 'true');
  state.selectedId = null;
  renderCards();
}
function resetInvitations() {
  events = startingEvents.map(event => ({ ...event }));
  render();
  role('page-announcement').textContent = 'Invitations reset. Studio Night and Friday Night are Invited; Campus Creative AI Forum is Going.';
}
function keepFocusInsidePanel(event) {
  if (!state.isPanelOpen || event.key !== 'Tab') return;
  const controls = [...ui.panel.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')]
    .filter(element => !element.closest('[hidden]'));
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

// WIRING: native listeners, no inline handlers or external JavaScript libraries.
ui.cards.forEach(button => button.addEventListener('click', () => openInvitation(button.dataset.eventId, button)));
document.querySelectorAll('[data-action="close-invitation"]').forEach(button => button.addEventListener('click', closeInvitation));
ui.accept.addEventListener('click', () => updateInvitation('going'));
ui.decline.addEventListener('click', () => updateInvitation('declined'));
document.querySelector('[data-action="reset"]').addEventListener('click', resetInvitations);
document.querySelector('[data-action="preview-empty"]').addEventListener('click', event => openInvitation(null, event.currentTarget));
document.querySelector('[data-action="preview-error"]').addEventListener('click', event => openInvitation('missing-event', event.currentTarget));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && state.isPanelOpen) {
    event.preventDefault();
    closeInvitation();
  }
  keepFocusInsidePanel(event);
});
render();
