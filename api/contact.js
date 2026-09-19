const OWNER_EMAIL = 'adeelshareef761@gmail.com';

function clean(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[character]));
}

module.exports = async (request, response) => {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  let data;
  try {
    data = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
  } catch {
    response.status(400).json({ error: 'Invalid request.' });
    return;
  }

  if (clean(data?.website, 100)) {
    response.status(200).json({ ok: true });
    return;
  }

  const submission = {
    full_name: clean(data?.fullName, 120),
    email: clean(data?.email, 254).toLowerCase(),
    phone: clean(data?.phone, 60),
    project_type: clean(data?.projectType, 120),
    budget: clean(data?.budget, 120),
    message: clean(data?.message, 5000)
  };

  if (!submission.full_name || !submission.email || !submission.message) {
    response.status(400).json({ error: 'Please complete your name, email, and message.' });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email)) {
    response.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Portfolio website <onboarding@resend.dev>';

  if (!supabaseUrl || !supabaseKey || !resendKey) {
    console.error('Missing contact form environment variables.');
    response.status(500).json({ error: 'The contact form is not configured yet.' });
    return;
  }

  try {
    const databaseResponse = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/contact_submissions`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(submission)
    });

    if (!databaseResponse.ok) {
      console.error('Supabase insert failed:', await databaseResponse.text());
      response.status(502).json({ error: 'Your message could not be saved. Please try again.' });
      return;
    }

    const emailDetails = [
      ['Full name', submission.full_name],
      ['Email', submission.email],
      ['Phone', submission.phone || 'Not provided'],
      ['Project type', submission.project_type || 'Not provided'],
      ['Budget', submission.budget || 'Not provided']
    ].map(([label, value]) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #e8e8e8;color:#6b7280;font-size:13px;width:34%;">${label}</td>
        <td style="padding:12px 0;border-bottom:1px solid #e8e8e8;color:#17202a;font-size:14px;font-weight:600;">${escapeHtml(value)}</td>
      </tr>`).join('');
    const messageHtml = escapeHtml(submission.message).replace(/\n/g, '<br>');
    const emailHtml = `
      <div style="margin:0;padding:32px 16px;background:#f3f5f7;font-family:Arial,Helvetica,sans-serif;color:#17202a;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e3e7eb;border-radius:12px;overflow:hidden;">
          <div style="padding:28px 32px;background:#121821;color:#ffffff;">
            <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#f8b27a;font-weight:bold;">Portfolio contact</div>
            <h1 style="margin:10px 0 0;font-size:25px;line-height:1.25;font-weight:700;">New project inquiry</h1>
            <p style="margin:8px 0 0;color:#cbd5e1;font-size:14px;">Someone has reached out through your website.</p>
          </div>
          <div style="padding:28px 32px;">
            <table role="presentation" style="width:100%;border-collapse:collapse;">${emailDetails}</table>
            <div style="margin-top:26px;padding:20px;background:#fff7f0;border-left:4px solid #ee9b65;border-radius:6px;">
              <div style="margin-bottom:8px;color:#6b7280;font-size:12px;letter-spacing:1px;text-transform:uppercase;font-weight:bold;">Message</div>
              <div style="color:#17202a;font-size:15px;line-height:1.7;">${messageHtml}</div>
            </div>
            <a href="mailto:${escapeHtml(submission.email)}" style="display:inline-block;margin-top:24px;padding:12px 20px;background:#ee9b65;color:#1c130d;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold;">Reply to ${escapeHtml(submission.full_name)}</a>
          </div>
          <div style="padding:18px 32px;border-top:1px solid #e8e8e8;color:#8993a1;font-size:12px;">Sent from adeel-shareef-ad.vercel.app</div>
        </div>
      </div>`;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [OWNER_EMAIL],
        reply_to: submission.email,
        subject: `New project inquiry from ${submission.full_name}`,
        html: emailHtml
      })
    });

    if (!emailResponse.ok) {
      console.error('Resend request failed:', await emailResponse.text());
      response.status(502).json({ error: 'Your message was saved, but the notification email could not be sent.' });
      return;
    }

    response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Contact form error:', error);
    response.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
