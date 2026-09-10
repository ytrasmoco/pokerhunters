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
  var PHONE_NUMBER = '07402200882';

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
        'Call back on: ' + phone,
        message ? 'Message: ' + message : null
      ]);
    });
  }

  // Sign-up form (signup.html)
  var signupForm = document.getElementById('signupForm');
  var signupStatus = document.getElementById('signupStatus');

  if (signupForm) {
    signupForm.addEventListener('submit', function (event) {
      event.preventDefault();

      var teamName = signupForm.teamName.value.trim();
      var name = signupForm.name.value.trim();
      var phone = signupForm.phone.value.trim();
      var area = signupForm.area.value;
      var date = signupForm.date.value;
      var people = signupForm.people.value;
      var notes = signupForm.notes.value.trim();
      var consent = signupForm.consent.checked;

      if (!name || !phone || !area || !date) {
        showError(signupStatus, 'Please fill in your name, phone number, area and preferred date.');
        return;
      }
      if (!consent) {
        showError(signupStatus, 'Please confirm the licence & consent checkbox before signing up.');
        return;
      }

      sendAsEmail(signupStatus, 'bookings@pokerhunters.co.uk', 'Poker Hunters sign-up', 'Poker Hunters sign-up', [
        teamName ? 'Team name: ' + teamName : null,
        'Lead contact: ' + name,
        'Phone: ' + phone,
        'Area: ' + area,
        'Preferred date: ' + date,
        'People: ' + people,
        notes ? 'Notes: ' + notes : null,
        'Licence & consent confirmed: Yes'
      ]);
    });
  }
})();
