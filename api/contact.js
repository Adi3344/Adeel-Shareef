const OWNER_EMAIL = 'adeelshareef09@gmail.com';

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

    const emailRows = Object.entries({
      'Full name': submission.full_name,
      Email: submission.email,
      Phone: submission.phone || 'Not provided',
      'Project type': submission.project_type || 'Not provided',
      Budget: submission.budget || 'Not provided',
      Message: submission.message
    });
    const emailHtml = emailRows.map(([label, value]) => `<p><strong>${label}</strong><br>${escapeHtml(value).replace(/\n/g, '<br>')}</p>`).join('');

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
        subject: `New portfolio inquiry from ${submission.full_name}`,
        html: `<h2>New portfolio contact submission</h2>${emailHtml}`
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
