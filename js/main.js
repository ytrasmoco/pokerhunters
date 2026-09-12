(function () {
  'use strict';

  // Mobile nav toggle
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Forms -> compose an email to the right Poker Hunters inbox with the
  // details filled in. Swap this for a real form backend (e.g. Formspree)
  // if a no-JS submission becomes preferable later.
  var PHONE_NUMBER = '07471176985';

  function sendAsEmail(status, address, subject, title, lines) {
    var body = encodeURIComponent([title].concat(lines.filter(Boolean)).join('\n'));
    var mailLink = 'mailto:' + address + '?subject=' + encodeURIComponent(subject) + '&body=' + body;

    status.innerHTML = 'Almost there — <a href="' + mailLink + '">tap here to open your email app</a> with your details ready to send to ' + address + '.';
    status.className = 'form-status is-visible form-status--success';

    window.location.href = mailLink;
  }

  function showError(status, msg) {
    status.textContent = msg;
    status.className = 'form-status is-visible';
  }

  // Enquiry form (contact.html)
  var enquiryForm = document.getElementById('enquiryForm');
  var enquiryStatus = document.getElementById('formStatus');

  if (enquiryForm) {
    enquiryForm.addEventListener('submit', function (event) {
      event.preventDefault();

      var name = enquiryForm.name.value.trim();
      var area = enquiryForm.area.value;
      var people = enquiryForm.people.value;
      var date = enquiryForm.date.value;
      var phone = enquiryForm.phone.value.trim();
      var message = enquiryForm.message.value.trim();

      if (!name || !area || !phone) {
        showError(enquiryStatus, 'Please fill in your name, preferred area and phone number.');
        return;
      }

      sendAsEmail(enquiryStatus, 'enquires@pokerhunters.co.uk', 'Poker Hunters enquiry', 'Poker Hunters enquiry', [
        'Name: ' + name,
        'Area: ' + area,
        'People: ' + people,
        date ? 'Preferred date: ' + date : null,
        'Phone: ' + phone,
        message ? 'Message: ' + message : null
      ]);
    });
  }

  // Sign-up form (signup.html)
  var signupForm = document.getElementById('signupForm');
  var signupStatus = document.getElementById('signupStatus');

  if (signupForm) {
    // Date options are populated and pre-filled by js/events.js
    // (renderSignupDateOptions), since they depend on the shared
    // event list and must exist before a date can be selected.

    signupForm.addEventListener('submit', function (event) {
      event.preventDefault();

      var teamName = signupForm.teamName.value.trim();
      var name = signupForm.name.value.trim();
      var email = signupForm.email.value.trim();
      var phone = signupForm.phone.value.trim();
      var area = signupForm.area.value;
      var date = signupForm.date.value;
      var people = signupForm.people.value;
      var notes = signupForm.notes.value.trim();
      var consent = signupForm.consent.checked;

      if (!name || !email || !phone || !area || !date) {
        showError(signupStatus, 'Please fill in your name, email, phone number, area and event date.');
        return;
      }
      if (!consent) {
        showError(signupStatus, 'Please confirm the licence & consent checkbox before signing up.');
        return;
      }

      var apiUrl = (typeof POKER_HUNTERS_BOOKING_API_URL !== 'undefined') ? POKER_HUNTERS_BOOKING_API_URL : '';
      if (!apiUrl || apiUrl.indexOf('REPLACE_WITH') === 0) {
        showError(signupStatus, 'Booking system is not set up yet. Please WhatsApp or email us directly instead.');
        return;
      }

      var submitBtn = signupForm.querySelector('button[type="submit"]');
      var originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting…';
      signupStatus.className = 'form-status';
      signupStatus.textContent = '';

      fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({ teamName: teamName, name: name, email: email, phone: phone, area: area, date: date, people: people, notes: notes })
      })
        .then(function (res) { return res.json(); })
        .then(function (result) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;

          if (result.status === 'confirmed') {
            signupStatus.innerHTML = 'Your place for ' + date + ' is reserved — one last step below.';
            signupStatus.className = 'form-status is-visible form-status--success';

            signupForm.hidden = true;
            document.getElementById('su-intro').hidden = true;
            document.getElementById('su-heading').textContent = 'You\'re In — Pay to Confirm';

            var paymentStep = document.getElementById('paymentStep');
            document.getElementById('paymentRef').textContent = name + ' — ' + date;
            paymentStep.hidden = false;
            paymentStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (result.status === 'full') {
            signupStatus.textContent = 'Sorry — that date just filled up. Please pick another date from the list above.';
            signupStatus.className = 'form-status is-visible';
          } else {
            showError(signupStatus, 'Something went wrong submitting your sign-up. Please WhatsApp or email us directly instead.');
          }
        })
        .catch(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
          showError(signupStatus, 'Could not reach the booking system. Please WhatsApp or email us directly instead.');
        });
    });
  }
})();
