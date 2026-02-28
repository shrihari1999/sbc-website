// Google Apps Script for SBC Application Form
// Deploy this as a Web App with "Anyone" access

var NOTIFY_EMAIL = 'sharebusinessconcepts';

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Add timestamp
    var timestamp = new Date();

    // Prepare row data
    var rowData = [
      timestamp,
      data.email,
      data.fullName,
      data.dob,
      data.gender,
      data.whatsapp,
      data.city,
      data.country,
      data.occupation,
      data.experience,
      Array.isArray(data.markets) ? data.markets.join(', ') : data.markets,
      data.challenge,
      data.previousCourse,
      Array.isArray(data.goals) ? data.goals.join(', ') : data.goals,
      data.program,
      data.availableFrom,
      data.availableTo
    ];

    // If sheet is empty, add headers
    if (sheet.getLastRow() === 0) {
      var headers = [
        'Timestamp',
        'Email',
        'Full Name',
        'Date of Birth',
        'Gender',
        'WhatsApp',
        'City',
        'Country',
        'Occupation',
        'Trading Experience',
        'Markets Traded',
        'Biggest Challenge',
        'Previous Courses',
        'Goals',
        'Program Selected',
        'Available From',
        'Available To'
      ];
      sheet.appendRow(headers);
    }

    // Append the data
    sheet.appendRow(rowData);

    // Send email notification
    sendNotification(data, timestamp);

    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendNotification(data, timestamp) {
  var subject = 'New SBC Application: ' + data.fullName + ' — ' + data.program;
  var body = 'New application received!\n\n'
    + '━━━━━━━━━━━━━━━━━━━━━━━━━\n'
    + 'Name:        ' + data.fullName + '\n'
    + 'Email:       ' + data.email + '\n'
    + 'WhatsApp:    ' + data.whatsapp + '\n'
    + 'DOB:         ' + data.dob + '\n'
    + 'Gender:      ' + data.gender + '\n'
    + 'City:        ' + data.city + ', ' + data.country + '\n'
    + '━━━━━━━━━━━━━━━━━━━━━━━━━\n'
    + 'Occupation:  ' + data.occupation + '\n'
    + 'Experience:  ' + data.experience + '\n'
    + 'Markets:     ' + (Array.isArray(data.markets) ? data.markets.join(', ') : data.markets) + '\n'
    + 'Challenge:   ' + data.challenge + '\n'
    + 'Prev Course: ' + data.previousCourse + '\n'
    + 'Goals:       ' + (Array.isArray(data.goals) ? data.goals.join(', ') : data.goals) + '\n'
    + '━━━━━━━━━━━━━━━━━━━━━━━━━\n'
    + 'Program:     ' + data.program + '\n'
    + 'Available:   ' + data.availableFrom + ' to ' + data.availableTo + '\n'
    + '━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'
    + 'Submitted: ' + timestamp.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

// Test function (optional)
function doGet() {
  return ContentService
    .createTextOutput('SBC Application Form Backend is running')
    .setMimeType(ContentService.MimeType.TEXT);
}
