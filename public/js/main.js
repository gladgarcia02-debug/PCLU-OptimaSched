/* PCLU-OptimaSched — client behaviour
 * Wires the "Check for conflicts" button (AJAX to POST /schedules/check)
 * and the suggestion chips on the schedule form. Progressive enhancement:
 * if JS is off, the server still validates on submit.
 */
(function () {
  'use strict';

  var form = document.getElementById('schedule-form');
  if (!form) return;

  var checkBtn = document.getElementById('check-btn');
  var resultBox = document.getElementById('check-result');

  function field(name) {
    return form.querySelector('[name="' + name + '"]');
  }

  function currentPayload() {
    return {
      section_id: (field('section_id') || {}).value || '',
      room_id: (field('room_id') || {}).value || '',
      day_of_week: (field('day_of_week') || {}).value || '',
      start_time: (field('start_time') || {}).value || '',
      end_time: (field('end_time') || {}).value || '',
      excludeId: form.getAttribute('data-exclude') || '',
    };
  }

  function render(state, data) {
    if (!resultBox) return;
    resultBox.className = 'check-result is-' + state;

    if (state === 'loading') {
      resultBox.innerHTML = '<span class="cr-spinner" aria-hidden="true"></span> Checking the timetable…';
      return;
    }
    if (state === 'ok') {
      resultBox.innerHTML =
        '<strong>✓ Clear.</strong> This slot has no clashes — you can add it to the timetable.';
      return;
    }
    if (state === 'error') {
      resultBox.innerHTML =
        '<strong>Could not check.</strong> ' +
        ((data && data.message) || 'Please try again.');
      return;
    }

    // state === 'conflict'
    var reasons = (data && data.reasons) || [];
    var suggestions = (data && data.suggestions) || [];
    var html = '<strong>✗ Conflict.</strong><ul class="cr-reasons">';
    reasons.forEach(function (r) {
      html += '<li>' + escapeHtml(r) + '</li>';
    });
    html += '</ul>';

    if (suggestions.length) {
      html += '<p class="cr-sub">Next open slots for this section &amp; room:</p>';
      html += '<div class="suggest-list">';
      suggestions.forEach(function (g) {
        var label = (g.day_label ? g.day_label.slice(0, 3) : '') +
          ' ' + g.start_time + '\u2013' + g.end_time;
        html += '<button type="button" class="suggest-chip" ' +
          'data-day="' + g.day_of_week + '" ' +
          'data-start="' + g.start_time + '" ' +
          'data-end="' + g.end_time + '">' + escapeHtml(label) + '</button>';
      });
      html += '</div>';
    }
    resultBox.innerHTML = html;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function runCheck() {
    var payload = currentPayload();
    if (!payload.section_id || !payload.room_id || !payload.start_time || !payload.end_time) {
      render('error', { message: 'Please fill in every field first.' });
      return;
    }
    render('loading');

    var body = new URLSearchParams(payload).toString();

    fetch('/schedules/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'fetch' },
      body: body,
      credentials: 'same-origin',
    })
      .then(function (res) { return res.json().then(function (d) { return { status: res.status, data: d }; }); })
      .then(function (r) {
        if (r.data && r.data.ok) render('ok', r.data);
        else render('conflict', r.data);
      })
      .catch(function () { render('error', { message: 'Network error.' }); });
  }

  if (checkBtn) checkBtn.addEventListener('click', runCheck);

  // Suggestion chips — both the server-rendered ones and any we inject.
  // Delegated so dynamically added chips work too.
  document.addEventListener('click', function (e) {
    var chip = e.target.closest ? e.target.closest('.suggest-chip') : null;
    if (!chip) return;
    e.preventDefault();

    var day = chip.getAttribute('data-day');
    var start = chip.getAttribute('data-start');
    var end = chip.getAttribute('data-end');

    if (day && field('day_of_week')) field('day_of_week').value = day;
    if (start && field('start_time')) field('start_time').value = start;
    if (end && field('end_time')) field('end_time').value = end;

    // Re-validate immediately so the user gets instant feedback.
    runCheck();

    var anchor = document.getElementById('check-result') || form;
    if (anchor.scrollIntoView) anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();
