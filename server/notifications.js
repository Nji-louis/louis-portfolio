const nodemailer = require('nodemailer');

function emailTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.NOTIFY_EMAIL) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

function leadText(lead) {
  return [
    'New Louis Portfolio lead', `Name: ${lead.name}`, `Email: ${lead.email}`,
    `Phone: ${lead.phone || 'Not provided'}`, `Country: ${lead.country || 'Not provided'}`,
    `Service: ${lead.service}`, `Budget: ${lead.budget}`, `Timeline: ${lead.timeline}`,
    `Message: ${lead.message}`, `Lead ID: ${lead.id}`
  ].join('\n');
}

async function notifyEmail(lead) {
  const transport = emailTransport();
  if (!transport) return { status: 'not_configured' };
  const body = leadText(lead);
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.NOTIFY_EMAIL,
    replyTo: lead.email,
    subject: `New project enquiry #${lead.id}: ${lead.service}`,
    text: body
  });
  // Send an acknowledgement to the prospect only if enabled and SMTP is configured.
  if (process.env.SEND_LEAD_ACK === 'true') {
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: lead.email,
      subject: 'We received your Louis Portfolio project enquiry',
      text: `Hello ${lead.name},\n\nThank you for contacting Louis Portfolio about ${lead.service}. Your enquiry has been received and will be reviewed.\n\nRegards,\nLouis Portfolio`
    });
  }
  return { status: 'sent' };
}

async function notifyWhatsApp(lead) {
  const { WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_NOTIFY_TO, WHATSAPP_TEMPLATE_NAME, WHATSAPP_TEMPLATE_LANG = 'en' } = process.env;
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_NOTIFY_TO) return { status: 'not_configured' };
  const endpoint = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v22.0'}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  let payload;
  if (WHATSAPP_TEMPLATE_NAME) {
    // Configure an approved Meta template with body parameters: name, service, budget, timeline, lead ID.
    payload = { messaging_product: 'whatsapp', to: WHATSAPP_NOTIFY_TO, type: 'template', template: {
      name: WHATSAPP_TEMPLATE_NAME, language: { code: WHATSAPP_TEMPLATE_LANG }, components: [{ type: 'body', parameters: [lead.name, lead.service, lead.budget, lead.timeline, String(lead.id)].map(text => ({ type: 'text', text: String(text).slice(0, 900) })) }]
    }};
  } else {
    // Free-form business-initiated messages may be rejected outside the 24-hour customer-service window.
    payload = { messaging_product: 'whatsapp', to: WHATSAPP_NOTIFY_TO, type: 'text', text: { body: leadText(lead).slice(0, 4000) } };
  }
  const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`WhatsApp API returned ${response.status}: ${detail.slice(0, 300)}`);
  }
  return { status: 'sent' };
}

module.exports = { notifyEmail, notifyWhatsApp };
