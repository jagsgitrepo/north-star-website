// North Star website forms -> Google Sheet (via a Google Apps Script web app).
// After deploying the Apps Script (see FORMS_SETUP.md), paste its Web app URL here.
const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzkSdnXORKMj7OjCm7HeIRSphvbz_o1_-IPHG8GcDaUDT2nhElV0g6cNHJpPSpSPHcu/exec';

(() => {
  const isConfigured = /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(FORM_ENDPOINT);

  document.querySelectorAll('form[data-form]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;

      const btn = form.querySelector('button[type="submit"]');
      const status = form.querySelector('.form-status');
      const success = document.getElementById(form.dataset.success);
      const label = btn.textContent;

      const data = new URLSearchParams(new FormData(form));
      data.append('form', form.dataset.form);
      data.append('page', location.href);

      btn.disabled = true;
      btn.textContent = 'Sending…';
      if (status) status.textContent = '';

      try {
        if (!isConfigured) throw new Error('FORM_ENDPOINT in script.js is not set yet.');
        // URL-encoded body = "simple" CORS request (no preflight), which Apps Script accepts.
        const res = await fetch(FORM_ENDPOINT, { method: 'POST', body: data });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || 'Submission failed');

        form.reset();
        form.style.display = 'none';
        if (success) { success.style.display = 'block'; success.focus(); }
      } catch (err) {
        console.error('[North Star form]', err);
        if (status) status.textContent = 'Sorry, we couldn’t submit your details. Please try again in a moment.';
        btn.disabled = false;
        btn.textContent = label;
      }
    });
  });
})();
