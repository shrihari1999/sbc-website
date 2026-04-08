// ============================================================
// Share Business Concepts — Schedule Manager (Google Apps Script)
// ============================================================
// SETUP: Run setupSheet() once from the Apps Script editor
//        (Run > setupSheet) to initialize formatting & validation.
// DEPLOY: Deploy > New deployment > Web app > Anyone > Deploy
// ============================================================

var DURATIONS = { 1: 1, 2: 4, 3: 2, 4: 2, 5: 3 };
var MAX_SPOTS = 7;
var TIMEZONE = 'Asia/Kolkata';

// --------------- Web endpoint ---------------

function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var bookingsSheet = ss.getSheetByName('Bookings');
  var blacklistSheet = ss.getSheetByName('Blacklist');

  // Get active bookings (archiving happens via daily trigger)
  var activeBookings = getActiveBookings(bookingsSheet);

  // Read blacklist
  var blacklistData = blacklistSheet.getDataRange().getValues();
  var blacklisted_dates = [];
  for (var k = 1; k < blacklistData.length; k++) {
    if (blacklistData[k][0]) {
      var d = new Date(blacklistData[k][0]);
      blacklisted_dates.push(Utilities.formatDate(d, TIMEZONE, 'yyyy-MM-dd'));
    }
  }

  var result = {
    bookings: activeBookings,
    blacklisted_dates: blacklisted_dates,
    max_spots: MAX_SPOTS
  };

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// --------------- Shared helpers ---------------

function getActiveBookings(bookingsSheet) {
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var bookingsData = bookingsSheet.getDataRange().getValues();
  var activeBookings = [];

  for (var i = 1; i < bookingsData.length; i++) {
    var row = bookingsData[i];
    var type = row[0];
    var startDate = row[1];
    var endDate = row[2];
    var spotsTaken = row[3];

    if (!type || !startDate) continue;

    var end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (end >= today) {
      activeBookings.push({
        booked_type: Number(type),
        booked_batch_start: Utilities.formatDate(new Date(startDate), TIMEZONE, 'yyyy-MM-dd'),
        booked_batch_end: Utilities.formatDate(new Date(endDate), TIMEZONE, 'yyyy-MM-dd'),
        spots_taken: Number(spotsTaken) || 0
      });
    }
  }

  return activeBookings;
}

// --------------- Daily archive (time-based trigger) ---------------

function archiveExpiredBookings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var bookingsSheet = ss.getSheetByName('Bookings');
  var historySheet = ss.getSheetByName('History');

  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var bookingsData = bookingsSheet.getDataRange().getValues();
  var rowsToArchive = [];

  for (var i = 1; i < bookingsData.length; i++) {
    var row = bookingsData[i];
    var type = row[0];
    var startDate = row[1];
    var endDate = row[2];
    var spotsTaken = row[3];

    if (!type || !startDate) continue;

    var end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (end < today) {
      rowsToArchive.push(i + 1);
      if (historySheet) {
        historySheet.appendRow([type, startDate, endDate, spotsTaken, new Date()]);
      }
    }
  }

  // Delete archived rows (bottom to top to preserve row indices)
  for (var j = rowsToArchive.length - 1; j >= 0; j--) {
    bookingsSheet.deleteRow(rowsToArchive[j]);
  }
}

// --------------- Trigger setup ---------------

function setupDailyTrigger() {
  // Remove existing daily triggers to avoid duplicates
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'archiveExpiredBookings') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Create daily trigger at midnight IST
  ScriptApp.newTrigger('archiveExpiredBookings')
    .timeBased()
    .everyDays(1)
    .atHour(0)
    .inTimezone('Asia/Kolkata')
    .create();
}

// --------------- Auto-fill end date on edit ---------------

function onEdit(e) {
  var ss = e.source;
  var sheet = ss.getActiveSheet();
  var sheetName = sheet.getName();

  if (sheetName === 'Bookings') {
    var col = e.range.getColumn();
    var row = e.range.getRow();
    if (row < 2) return;

    // Columns: A=booked_type, B=booked_batch_start, C=booked_batch_end, D=spots_taken
    // Trigger on type (A) or start date (B) change
    if (col === 1 || col === 2) {
      var type = sheet.getRange(row, 1).getValue();
      var startDate = sheet.getRange(row, 2).getValue();

      if (type && startDate && DURATIONS[type]) {
        var endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + DURATIONS[type] - 1);
        sheet.getRange(row, 3).setValue(endDate);
      }
    }

    // If type is cleared, clear the rest of the row
    if (col === 1 && !e.value) {
      sheet.getRange(row, 2, 1, 3).clearContent();
    }
  }

  // Validate on both Bookings and Blacklist edits
  if (sheetName === 'Bookings' || sheetName === 'Blacklist') {
    validateAll(ss);
  }
}

// --------------- Validation ---------------

function validateAll(ss) {
  var bookingsSheet = ss.getSheetByName('Bookings');
  var blacklistSheet = ss.getSheetByName('Blacklist');
  var WARNING_COLOR = '#fce4e4';

  // --- Read bookings ---
  var bookingsLastRow = bookingsSheet.getLastRow();
  var bookings = [];
  if (bookingsLastRow > 1) {
    var bookingsData = bookingsSheet.getRange(2, 1, bookingsLastRow - 1, 3).getValues();
    for (var i = 0; i < bookingsData.length; i++) {
      var type = bookingsData[i][0];
      var start = bookingsData[i][1];
      var end = bookingsData[i][2];
      if (type && start && end) {
        bookings.push({
          row: i + 2,
          start: new Date(start).getTime(),
          end: new Date(end).getTime()
        });
      }
    }
  }

  // --- Read blacklist dates ---
  var blacklistLastRow = blacklistSheet.getLastRow();
  var blacklistDates = [];
  if (blacklistLastRow > 1) {
    var blacklistData = blacklistSheet.getRange(2, 1, blacklistLastRow - 1, 1).getValues();
    for (var j = 0; j < blacklistData.length; j++) {
      if (blacklistData[j][0]) {
        blacklistDates.push({
          row: j + 2,
          time: new Date(blacklistData[j][0]).getTime()
        });
      }
    }
  }

  // --- Reset Bookings sheet styling ---
  if (bookingsLastRow > 1) {
    bookingsSheet.getRange(2, 1, bookingsLastRow - 1, 4).setBackground(null);
    bookingsSheet.getRange(2, 3, bookingsLastRow - 1, 1).setBackground('#e8e8e8');
    bookingsSheet.getRange(2, 1, bookingsLastRow - 1, 1).clearNote();
  }

  // --- Reset Blacklist sheet styling ---
  if (blacklistLastRow > 1) {
    blacklistSheet.getRange(2, 1, blacklistLastRow - 1, 1).setBackground(null);
    blacklistSheet.getRange(2, 1, blacklistLastRow - 1, 1).clearNote();
  }

  // --- Check booking-booking overlaps ---
  var bookingConflictRows = {};
  for (var a = 0; a < bookings.length; a++) {
    for (var b = a + 1; b < bookings.length; b++) {
      if (bookings[a].start <= bookings[b].end && bookings[b].start <= bookings[a].end) {
        bookingConflictRows[bookings[a].row] = true;
        bookingConflictRows[bookings[b].row] = true;
      }
    }
  }

  for (var bRow in bookingConflictRows) {
    var r = Number(bRow);
    bookingsSheet.getRange(r, 1, 1, 2).setBackground(WARNING_COLOR);
    bookingsSheet.getRange(r, 4).setBackground(WARNING_COLOR);
    bookingsSheet.getRange(r, 1).setNote('Dates overlap with another booking');
  }

  // --- Check blacklist-booking conflicts ---
  var blacklistConflictRows = {};
  var bookingBlacklistConflictRows = {};

  for (var k = 0; k < blacklistDates.length; k++) {
    var blDate = blacklistDates[k].time;
    for (var m = 0; m < bookings.length; m++) {
      if (blDate >= bookings[m].start && blDate <= bookings[m].end) {
        blacklistConflictRows[blacklistDates[k].row] = true;
        bookingBlacklistConflictRows[bookings[m].row] = true;
      }
    }
  }

  for (var blRow in blacklistConflictRows) {
    var br = Number(blRow);
    blacklistSheet.getRange(br, 1).setBackground(WARNING_COLOR);
    blacklistSheet.getRange(br, 1).setNote('This date falls within a booked batch');
  }

  for (var bbRow in bookingBlacklistConflictRows) {
    var bbr = Number(bbRow);
    // Only add note if not already marked by booking-booking overlap
    if (!bookingConflictRows[bbr]) {
      bookingsSheet.getRange(bbr, 1, 1, 2).setBackground(WARNING_COLOR);
      bookingsSheet.getRange(bbr, 4).setBackground(WARNING_COLOR);
      bookingsSheet.getRange(bbr, 1).setNote('Booking dates conflict with blacklisted date(s)');
    } else {
      // Append to existing note
      var existing = bookingsSheet.getRange(bbr, 1).getNote();
      bookingsSheet.getRange(bbr, 1).setNote(existing + '\nAlso conflicts with blacklisted date(s)');
    }
  }
}

// --------------- One-time setup ---------------

function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // --- Bookings sheet ---
  var bookingsSheet = ss.getSheetByName('Bookings') || ss.insertSheet('Bookings');
  bookingsSheet.clear();

  var headers = ['booked_type', 'booked_batch_start', 'booked_batch_end', 'spots_taken'];
  bookingsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Header formatting
  bookingsSheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#4a90d9')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');

  // Column widths
  bookingsSheet.setColumnWidth(1, 120);
  bookingsSheet.setColumnWidth(2, 160);
  bookingsSheet.setColumnWidth(3, 160);
  bookingsSheet.setColumnWidth(4, 120);

  // Apply validation and formatting to rows 2-50
  var dataRange = 50;

  // Data validation: booked_type dropdown (1-5)
  var typeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['1', '2', '3', '4', '5'], true)
    .setAllowInvalid(false)
    .setHelpText('Select program type (1-5)')
    .build();
  bookingsSheet.getRange(2, 1, dataRange, 1).setDataValidation(typeRule);

  // Data validation: start dates
  var dateRule = SpreadsheetApp.newDataValidation()
    .requireDate()
    .setAllowInvalid(false)
    .setHelpText('Enter a valid date (dd/mm/yyyy)')
    .build();
  bookingsSheet.getRange(2, 2, dataRange, 1).setDataValidation(dateRule);
  bookingsSheet.getRange(2, 2, dataRange, 1).setNumberFormat('dd/MM/yyyy');

  // End date: auto-calculated (greyed out)
  bookingsSheet.getRange(2, 3, dataRange, 1).setNumberFormat('dd/MM/yyyy');
  bookingsSheet.getRange(2, 3, dataRange, 1).setBackground('#e8e8e8');
  bookingsSheet.getRange(1, 3).setNote('Auto-calculated. Do not edit.');

  // Data validation: spots_taken (0-7)
  var spotsRule = SpreadsheetApp.newDataValidation()
    .requireNumberBetween(0, MAX_SPOTS)
    .setAllowInvalid(false)
    .setHelpText('Number of spots taken (0-' + MAX_SPOTS + ')')
    .build();
  bookingsSheet.getRange(2, 4, dataRange, 1).setDataValidation(spotsRule);
  bookingsSheet.getRange(2, 4, dataRange, 1).setHorizontalAlignment('center');

  // Freeze header row
  bookingsSheet.setFrozenRows(1);

  // --- Blacklist sheet ---
  var blacklistSheet = ss.getSheetByName('Blacklist') || ss.insertSheet('Blacklist');
  blacklistSheet.clear();

  blacklistSheet.getRange('A1').setValue('date');
  blacklistSheet.getRange('A1')
    .setFontWeight('bold')
    .setBackground('#d94a4a')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');
  blacklistSheet.setColumnWidth(1, 160);

  blacklistSheet.getRange('A2:A100').setNumberFormat('dd/MM/yyyy');
  var blDateRule = SpreadsheetApp.newDataValidation()
    .requireDate()
    .setAllowInvalid(false)
    .build();
  blacklistSheet.getRange('A2:A100').setDataValidation(blDateRule);
  blacklistSheet.setFrozenRows(1);

  // --- History sheet ---
  var historySheet = ss.getSheetByName('History') || ss.insertSheet('History');
  historySheet.clear();

  var historyHeaders = ['booked_type', 'booked_batch_start', 'booked_batch_end', 'spots_taken', 'archived_on'];
  historySheet.getRange(1, 1, 1, historyHeaders.length).setValues([historyHeaders]);
  historySheet.getRange(1, 1, 1, historyHeaders.length)
    .setFontWeight('bold')
    .setBackground('#2e7d32')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');
  historySheet.setColumnWidth(1, 120);
  historySheet.setColumnWidth(2, 160);
  historySheet.setColumnWidth(3, 160);
  historySheet.setColumnWidth(4, 120);
  historySheet.setColumnWidth(5, 180);
  historySheet.getRange('B2:C100').setNumberFormat('dd/MM/yyyy');
  historySheet.getRange('E2:E100').setNumberFormat('dd/MM/yyyy HH:mm');
  historySheet.setFrozenRows(1);

  // --- Instructions sheet ---
  var helpSheet = ss.getSheetByName('Instructions') || ss.insertSheet('Instructions');
  helpSheet.clear();
  helpSheet.setColumnWidth(1, 600);

  var instructions = [
    ['SCHEDULE MANAGER — INSTRUCTIONS'],
    [''],
    ['BOOKINGS SHEET'],
    ['• Each row represents one booked batch.'],
    ['• booked_type: Select 1-5 for the program type.'],
    ['• booked_batch_start: Enter the start date of the batch.'],
    ['• booked_batch_end: Auto-calculated based on type. Do not edit.'],
    ['• spots_taken: Number of confirmed participants (max ' + MAX_SPOTS + ').'],
    ['• You can have multiple active bookings at the same time.'],
    [''],
    ['PROGRAM DURATIONS (auto-calculated)'],
    ['• Type 1 (Pure Fundamentals): 1 day'],
    ['• Type 2 (Structured Trading): 4 consecutive days'],
    ['• Type 3 (Structured Trading - Fast Track): 2 consecutive days'],
    ['• Type 4 (Options Strategies): 2 consecutive days'],
    ['• Type 5 (NISM Exam Training): 3 consecutive days'],
    [''],
    ['HOW IT WORKS'],
    ['• Auto-generated batches on the website skip dates that overlap with any active booking.'],
    ['• If a batch reaches ' + MAX_SPOTS + ' spots, it is hidden from the website (not shown as "fully booked").'],
    ['• The website never shows how many spots are booked or remaining.'],
    ['• Expired bookings are automatically archived to the History sheet daily at midnight IST.'],
    ['• Overlapping bookings are highlighted in red with a note. Resolve conflicts to avoid issues.'],
    [''],
    ['BLACKLIST SHEET'],
    ['• Add dates (one per row) to block them from auto-generated batches.'],
    ['• Use this for holidays, personal days off, etc.'],
    [''],
    ['TO DELETE A BOOKING'],
    ['• Simply delete the entire row in the Bookings sheet.'],
  ];

  helpSheet.getRange(1, 1, instructions.length, 1).setValues(instructions);
  helpSheet.getRange('A1').setFontWeight('bold').setFontSize(14);
  helpSheet.getRange('A3').setFontWeight('bold').setFontSize(12);
  helpSheet.getRange('A11').setFontWeight('bold').setFontSize(12);
  helpSheet.getRange('A18').setFontWeight('bold').setFontSize(12);
  helpSheet.getRange('A23').setFontWeight('bold').setFontSize(12);
  helpSheet.getRange('A26').setFontWeight('bold').setFontSize(12);

  // --- Daily trigger ---
  setupDailyTrigger();

  // --- Custom menu ---
  createMenu();

  SpreadsheetApp.getUi().alert('Setup complete! Bookings, blacklist, history, and instructions sheets are ready.\n\nDaily archive trigger has been set up (runs at midnight IST).');
}

// --------------- Custom menu ---------------

function onOpen() {
  createMenu();
}

function createMenu() {
  SpreadsheetApp.getUi().createMenu('SBC Schedule')
    .addItem('Re-run setup', 'setupSheet')
    .addToUi();
}
