/**
 * Poker Hunters — booking backend.
 *
 * SETUP (one-time):
 * 1. Create a new Google Sheet.
 * 2. Extensions > Apps Script.
 * 3. Delete any starter code and paste this whole file in.
 * 4. Save (disk icon).
 * 5. Deploy > New deployment > gear icon > "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Click Deploy. Google will ask you to authorize — click through
 *    "Advanced" > "Go to [project name] (unsafe)" if it warns you;
 *    this is normal for your own script, not a real security issue.
 * 7. Copy the "Web app URL" it gives you — that's what gets pasted
 *    into js/events.js on the website (BOOKING_API_URL).
 *
 * Every time you change this code, you must create a NEW deployment
 * (Deploy > Manage deployments > edit > New version) for the change
 * to take effect — saving alone isn't enough.
 */

var CAR_CAP_PER_DATE = 12; // matches the FAQ's "limited to 12 teams/cars"
var OWNER_NOTIFY_EMAIL = 'bookings@pokerhunters.co.uk';
var MONZO_LINK = 'https://monzo.me/martinhughes20';

var HEADERS = ['Timestamp', 'Event Date', 'Status', 'Team Name', 'Lead Contact', 'Email', 'Phone', 'Area', 'People', 'Notes'];

function getSheet_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

function countConfirmed_(sheet, eventDate) {
  var rows = sheet.getDataRange().getValues();
  var count = 0;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][1] === eventDate && rows[i][2] === 'Confirmed') {
      count++;
    }
  }
  return count;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getSheet_();

    var eventDate = String(data.date || '').trim();
    if (!eventDate) {
      return jsonOutput_({ status: 'error', message: 'No date provided' });
    }

    var confirmedCount = countConfirmed_(sheet, eventDate);
    var status = confirmedCount < CAR_CAP_PER_DATE ? 'Confirmed' : 'Full';

    sheet.appendRow([
      new Date(),
      eventDate,
      status,
      data.teamName || '',
      data.name || '',
      data.email || '',
      data.phone || '',
      data.area || '',
      data.people || '',
      data.notes || ''
    ]);

    if (data.email) {
      if (status === 'Confirmed') {
        MailApp.sendEmail(
          data.email,
          'Poker Hunters — Booking Confirmed for ' + eventDate,
          'Hi ' + (data.name || '') + ',\n\n' +
          'You\'re booked in for ' + eventDate + '!\n\n' +
          'Team: ' + (data.teamName || 'N/A') + '\n' +
          'People: ' + (data.people || '') + '\n' +
          'Area: ' + (data.area || '') + '\n\n' +
          'Last step — please pay £25 via Monzo to secure your place:\n' +
          MONZO_LINK + '\n' +
          '(Add your name and the date as the payment reference so we can match it up.)\n\n' +
          'See you there!\nPoker Hunters'
        );
      } else {
        MailApp.sendEmail(
          data.email,
          'Poker Hunters — ' + eventDate + ' is fully booked',
          'Hi ' + (data.name || '') + ',\n\n' +
          'Sorry — ' + eventDate + ' just reached our ' + CAR_CAP_PER_DATE + '-car limit.\n\n' +
          'Check www.pokerhunters.co.uk/events.html for other available dates, ' +
          'or get in touch and we\'ll let you know when we add more.\n\nPoker Hunters'
        );
      }
    }

    MailApp.sendEmail(
      OWNER_NOTIFY_EMAIL,
      'New sign-up (' + status + '): ' + eventDate,
      'Team: ' + (data.teamName || 'N/A') + '\n' +
      'Name: ' + (data.name || '') + '\n' +
      'Email: ' + (data.email || '') + '\n' +
      'Phone: ' + (data.phone || '') + '\n' +
      'Area: ' + (data.area || '') + '\n' +
      'Date: ' + eventDate + '\n' +
      'People: ' + (data.people || '') + '\n' +
      'Notes: ' + (data.notes || '') + '\n' +
      'Status: ' + status
    );

    return jsonOutput_({ status: status.toLowerCase() });
  } catch (err) {
    return jsonOutput_({ status: 'error', message: err.message });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var sheet = getSheet_();
  var rows = sheet.getDataRange().getValues();
  var counts = {};

  for (var i = 1; i < rows.length; i++) {
    var date = rows[i][1];
    var status = rows[i][2];
    if (date && status === 'Confirmed') {
      counts[date] = (counts[date] || 0) + 1;
    }
  }

  var fullDates = [];
  for (var d in counts) {
    if (counts[d] >= CAR_CAP_PER_DATE) fullDates.push(d);
  }

  return jsonOutput_({ fullDates: fullDates, counts: counts, cap: CAR_CAP_PER_DATE });
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
