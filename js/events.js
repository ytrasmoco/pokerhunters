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
  { date: '2026-09-25', notes: 'Bonus checkpoint added for this one' },
  { date: '2026-10-25' },
  { date: '2026-11-29', notes: 'Bonus checkpoint added for this one' },
];

/*
 * Booking backend (Google Apps Script Web App URL). See
 * google-apps-script/Code.gs for the backend code and setup
 * instructions. Paste the deployed Web App URL below once set up.
 */
const POKER_HUNTERS_BOOKING_API_URL = 'https://script.google.com/macros/s/AKfycbzbGE7AlTYacnL9zwkzcsrcRiJwB4w7NNDCxAZW6bwl1NNhKplrZYBzliigcV2Qmo43rg/exec';

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

  // Ask the booking backend which dates are already full. Resolves to
  // an empty array (nothing marked full) if the backend isn't set up,
  // unreachable, or just slow to wake up (Apps Script cold starts can
  // take several seconds) — a hard timeout means this can never hang
  // the page waiting on it. The real capacity cap is still enforced
  // server-side at sign-up time regardless of what this shows.
  function fetchFullDates() {
    if (!POKER_HUNTERS_BOOKING_API_URL || POKER_HUNTERS_BOOKING_API_URL.indexOf('REPLACE_WITH') === 0) {
      return Promise.resolve([]);
    }

    var timeoutMs = 8000;
    var hasAbortController = typeof AbortController !== 'undefined';
    var controller = hasAbortController ? new AbortController() : null;
    var timeoutId = setTimeout(function () {
      if (controller) controller.abort();
    }, timeoutMs);

    return fetch(POKER_HUNTERS_BOOKING_API_URL, controller ? { signal: controller.signal } : undefined)
      .then(function (res) { return res.json(); })
      .then(function (data) { return data.fullDates || []; })
      .catch(function () { return []; })
      .then(function (result) {
        clearTimeout(timeoutId);
        return result;
      });
  }

  function renderNextEvent(fullDates) {
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
    var isFull = fullDates.indexOf(next.iso) !== -1;

    el.innerHTML =
      '<p class="next-event__date">' + formatDate(next.date) + (isFull ? ' — Fully Booked' : '') + '</p>' +
      (next.notes ? '<p class="next-event__notes">' + next.notes + '</p>' : '') +
      '<div class="next-event__ctas">' +
      (isFull
        ? '<a href="https://wa.me/447471176985" target="_blank" rel="noopener" class="btn btn--gold">Ask About This Date</a>'
        : '<a href="signup.html?date=' + next.iso + '" class="btn btn--gold">Sign Up for This Date</a>') +
      (upcoming.length > 1 ? '<a href="events.html" class="btn btn--outline">See All Upcoming Dates</a>' : '') +
      '</div>';
  }

  function renderEventsList(fullDates) {
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
      var isFull = fullDates.indexOf(ev.iso) !== -1;
      return '<div class="event-card">' +
        '<p class="event-card__date">' + formatDate(ev.date) + (isFull ? ' — Fully Booked' : '') + '</p>' +
        (ev.notes ? '<p class="event-card__notes">' + ev.notes + '</p>' : '') +
        (isFull
          ? '<a href="https://wa.me/447471176985" target="_blank" rel="noopener" class="btn btn--outline">Ask About This Date</a>'
          : '<a href="signup.html?date=' + ev.iso + '" class="btn btn--primary">Sign Up for This Date</a>') +
        '</div>';
    }).join('');
  }

  function renderSignupDateOptions(fullDates) {
    var select = document.getElementById('su-date');
    if (!select) return;

    // Remember whatever's already selected so a later re-render (once the
    // capacity check comes back) doesn't clobber a choice the visitor's
    // already made.
    var previousValue = select.value;

    var upcoming = getUpcoming();

    if (upcoming.length === 0) {
      select.innerHTML = '<option value="" disabled selected>No dates available — please contact us</option>';
      return;
    }

    var options = ['<option value="" disabled selected>Choose a date</option>'].concat(
      upcoming.map(function (ev) {
        var isFull = fullDates.indexOf(ev.iso) !== -1;
        var label = formatDate(ev.date) + (ev.notes ? ' *' : '') + (isFull ? ' (FULL)' : '');
        return '<option value="' + ev.iso + '"' + (isFull ? ' disabled' : '') + '>' + label + '</option>';
      })
    );
    select.innerHTML = options.join('');

    // Pre-fill if arriving via a "Sign Up for This Date" link
    // (e.g. signup.html?date=2026-10-18) from the homepage or events page,
    // otherwise restore whatever was already selected.
    var requestedDate = new URLSearchParams(window.location.search).get('date') || previousValue;
    if (requestedDate && upcoming.some(function (ev) { return ev.iso === requestedDate; }) && fullDates.indexOf(requestedDate) === -1) {
      select.value = requestedDate;
    }

    // Spell out what each "*" means, since the dropdown itself only
    // has room for a short label.
    var legend = document.getElementById('su-date-legend');
    if (legend) {
      var noted = upcoming.filter(function (ev) { return ev.notes; });
      if (noted.length) {
        legend.innerHTML = noted.map(function (ev) {
          return '<span class="hint">* ' + formatDate(ev.date) + ' — ' + ev.notes + '</span>';
        }).join('<br>');
        legend.hidden = false;
      } else {
        legend.innerHTML = '';
        legend.hidden = true;
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Render immediately with local data so the page never waits on the
    // booking backend — dates always show up straight away. If/when the
    // capacity check comes back, re-render to add any "(FULL)" labels.
    renderNextEvent([]);
    renderEventsList([]);
    renderSignupDateOptions([]);

    fetchFullDates().then(function (fullDates) {
      if (fullDates.length === 0) return;
      renderNextEvent(fullDates);
      renderEventsList(fullDates);
      renderSignupDateOptions(fullDates);
    });
  });
})();
