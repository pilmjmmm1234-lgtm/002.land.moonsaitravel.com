/**
 * Moon's AI Travel — Gmail auto-reply
 * 1. Paste this into Google Apps Script (the Gmail account that should send).
 * 2. Deploy → New deployment → Web app
 *    Execute as: Me
 *    Who has access: Anyone
 * 3. Copy the Web App URL into Admin Office → Contact.
 */
function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const to = String(data.to || "").trim();
    const pin = String(data.pin || "");
    const url = String(data.url || "");
    const fill = (value) =>
      String(value || "")
        .split("{{pin}}")
        .join(pin)
        .split("{{url}}")
        .join(url);
    const subject = fill(data.subject || "Moon's AI Travel");
    const body = fill(data.body || data.text || "");
    if (!to || to.indexOf("@") < 0) {
      return json_({ success: false, error: "email" });
    }
    MailApp.sendEmail({
      to: to,
      subject: subject,
      body: body,
    });
    return json_({ success: true });
  } catch (err) {
    return json_({ success: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}