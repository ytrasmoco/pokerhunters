/*
 * ============================================================
 *  POKER HUNTERS — UPCOMING EVENTS
 * ============================================================
 * To add a new hunt date, add a new line inside the square
 * brackets below, following the same pattern as the examples.
 *
 * Each event needs:
 *   date  — required, format YYYY-MM-DD (year-month-day)
 *   notes — optional, a short line shown under the date
 *
 * IMPORTANT: every line except the last one needs a comma "," at
 * the end. Miss a comma and the events won't show up anywhere.
 *
 * Past dates are hidden automatically — you never need to
 * delete old ones, just leave them here or remove them, either
 * is fine.
 *
 * Example:
 *   { date: '2026-11-15' },
 *   { date: '2026-12-06', notes: 'Christmas lights special route' },
 * ============================================================
 */
const POKER_HUNTERS_EVENTS = [
  { date: '2026-10-18' },
  { date: '2026-11-08' },
  { date: '2026-11-29', notes: 'Bonus checkpoint added for this one' },
];

/* ============================================================
 *  Rendering logic — no need to edit anything below this line
 * ============================================================ */
(function () {
  'use strict';

  function parseDate(str) {
    var parts = str.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function getUpcoming() {
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    return POKER_HUNTERS_EVENTS
      .map(function (ev) {
        return { date: parseDate(ev.date), iso: ev.date, notes: ev.notes || '' };
      })
      .filter(function (ev) { return ev.date >= today; })
      .sort(function (a, b) { return a.date - b.date; });
  }

  function renderNextEvent() {
    var el = document.getElementById('nextEvent');
    if (!el) return;

    var upcoming = getUpcoming();

    if (upcoming.length === 0) {
      el.innerHTML =
        '<p class="next-event__date">No dates confirmed yet</p>' +
        '<p class="next-event__notes">Sign up to be the first to hear about the next one.</p>' +
        '<a href="signup.html" class="btn btn--gold">Sign Up for Updates</a>';
      return;
    }

    var next = upcoming[0];
    el.innerHTML =
      '<span class="eyebrow">Next Hunt</span>' +
      '<p class="next-event__date">' + formatDate(next.date) + '</p>' +
      (next.notes ? '<p class="next-event__notes">' + next.notes + '</p>' : '') +
      '<div class="next-event__ctas">' +
      '<a href="signup.html?date=' + next.iso + '" class="btn btn--gold">Sign Up for This Date</a>' +
      (upcoming.length > 1 ? '<a href="events.html" class="btn btn--outline">See All Upcoming Dates</a>' : '') +
      '</div>';
  }

  function renderEventsList() {
    var el = document.getElementById('eventsList');
    if (!el) return;

    var upcoming = getUpcoming();

    if (upcoming.length === 0) {
      el.innerHTML =
        '<div class="event-card event-card--empty">' +
        '<p>No dates confirmed right now — check back soon, or sign up and we\'ll let you know as soon as the next one\'s set.</p>' +
        '<a href="signup.html" class="btn btn--primary">Register Your Interest</a>' +
        '</div>';
      return;
    }

    el.innerHTML = upcoming.map(function (ev) {
      return '<div class="event-card">' +
        '<p class="event-card__date">' + formatDate(ev.date) + '</p>' +
        (ev.notes ? '<p class="event-card__notes">' + ev.notes + '</p>' : '') +
        '<a href="signup.html?date=' + ev.iso + '" class="btn btn--primary">Sign Up for This Date</a>' +
        '</div>';
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderNextEvent();
    renderEventsList();
  });
})();
