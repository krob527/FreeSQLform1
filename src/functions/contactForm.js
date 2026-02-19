const { app } = require('@azure/functions');

const SUBMIT_URL = '/api/submitForm';

const formHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Workshop Registration</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #fff;
      padding: 24px 28px 40px;
      color: #333;
      max-width: 680px;
    }
    .question { margin-bottom: 28px; }
    .question-label {
      font-size: 0.95rem;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    .question-hint {
      font-size: 0.82rem;
      color: #666;
      margin-bottom: 10px;
    }
    .required { color: #c00; margin-left: 2px; }
    input[type="text"], input[type="email"], input[type="tel"], textarea {
      width: 100%;
      padding: 9px 12px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 0.93rem;
      color: #333;
      background: #fafafa;
      transition: border-color 0.15s;
    }
    input[type="text"]:focus, input[type="email"]:focus,
    input[type="tel"]:focus, textarea:focus {
      outline: none;
      border-color: #0078d4;
      background: #fff;
    }
    textarea { resize: vertical; min-height: 90px; }
    .checkbox-group { display: flex; flex-direction: column; gap: 10px; }
    .checkbox-row { display: flex; align-items: center; gap: 10px; }
    .checkbox-row input[type="checkbox"] {
      width: 16px; height: 16px;
      accent-color: #0078d4;
      flex-shrink: 0;
      cursor: pointer;
    }
    .checkbox-row label {
      font-size: 0.92rem;
      color: #333;
      cursor: pointer;
      font-weight: normal;
    }
    .other-text {
      flex: 1;
      padding: 5px 10px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 0.88rem;
      background: #fafafa;
      display: none;
    }
    .other-text:focus { outline: none; border-color: #0078d4; background: #fff; }
    .field-error { color: #c00; font-size: 0.8rem; margin-top: 5px; display: none; }
    button[type="submit"] {
      margin-top: 12px;
      padding: 11px 32px;
      background: #0078d4;
      color: #fff;
      border: none;
      border-radius: 4px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    button[type="submit"]:hover { background: #005a9e; }
    button[type="submit"]:disabled { background: #8ab4d9; cursor: not-allowed; }
    #status {
      margin-top: 16px;
      padding: 12px 16px;
      border-radius: 4px;
      font-size: 0.9rem;
      display: none;
    }
    #status.success { background: #dff6dd; color: #0d5e22; display: block; }
    #status.error   { background: #fde7e9; color: #a4262c; display: block; }
  </style>
</head>
<body>
  <form id="regForm" novalidate>

    <div class="question">
      <div class="question-label">1. Full Name <span class="required">*</span></div>
      <div class="question-hint">Please enter your first and last name.</div>
      <input type="text" id="fullName" placeholder="Enter your answer" />
      <div class="field-error" id="fullNameErr">Please enter your full name.</div>
    </div>

    <div class="question">
      <div class="question-label">2. Email Address <span class="required">*</span></div>
      <div class="question-hint">We'll send important workshop details to this address.</div>
      <input type="email" id="email" placeholder="Enter your answer" />
      <div class="field-error" id="emailErr">Please enter a valid email address.</div>
    </div>

    <div class="question">
      <div class="question-label">3. Phone Number</div>
      <div class="question-hint">Optional, for last-minute updates.</div>
      <input type="tel" id="phone" placeholder="Enter your answer" />
    </div>

    <div class="question">
      <div class="question-label">4. What would make this session extremely valuable for you? <span class="required">*</span></div>
      <div class="checkbox-group">
        <div class="checkbox-row"><input type="checkbox" id="sv1" name="sessionValue" value="Make more money" /><label for="sv1">Make more money</label></div>
        <div class="checkbox-row"><input type="checkbox" id="sv2" name="sessionValue" value="Save time" /><label for="sv2">Save time</label></div>
        <div class="checkbox-row"><input type="checkbox" id="sv3" name="sessionValue" value="Reduce expenses" /><label for="sv3">Reduce expenses</label></div>
        <div class="checkbox-row"><input type="checkbox" id="sv4" name="sessionValue" value="Close blind spots in my knowledge" /><label for="sv4">Close blind spots in my knowledge</label></div>
        <div class="checkbox-row"><input type="checkbox" id="sv5" name="sessionValue" value="Other" /><label for="sv5">Other</label><input type="text" id="svOther" class="other-text" placeholder="Please specify..." /></div>
      </div>
      <div class="field-error" id="sessionValueErr">Please select at least one option.</div>
    </div>

    <div class="question">
      <div class="question-label">5. Where do you want AI to help you the most right now? <span class="required">*</span></div>
      <div class="question-hint">Select all that apply.</div>
      <div class="checkbox-group">
        <div class="checkbox-row"><input type="checkbox" id="ah1" name="aiHelpAreas" value="Work productivity" /><label for="ah1">Work productivity</label></div>
        <div class="checkbox-row"><input type="checkbox" id="ah2" name="aiHelpAreas" value="Business operations" /><label for="ah2">Business operations</label></div>
        <div class="checkbox-row"><input type="checkbox" id="ah3" name="aiHelpAreas" value="Marketing / content creation" /><label for="ah3">Marketing / content creation</label></div>
        <div class="checkbox-row"><input type="checkbox" id="ah4" name="aiHelpAreas" value="Career growth or resume support" /><label for="ah4">Career growth or resume support</label></div>
        <div class="checkbox-row"><input type="checkbox" id="ah5" name="aiHelpAreas" value="Personal life efficiency" /><label for="ah5">Personal life efficiency</label></div>
        <div class="checkbox-row"><input type="checkbox" id="ah6" name="aiHelpAreas" value="Learning AI fundamentals" /><label for="ah6">Learning AI fundamentals</label></div>
        <div class="checkbox-row"><input type="checkbox" id="ah7" name="aiHelpAreas" value="Other" /><label for="ah7">Other (please specify)</label><input type="text" id="ahOther" class="other-text" placeholder="Please specify..." /></div>
      </div>
      <div class="field-error" id="aiHelpAreasErr">Please select at least one option.</div>
    </div>

    <div class="question">
      <div class="question-label">6. Which AI tools do you currently use? <span class="required">*</span></div>
      <div class="question-hint">Check all that apply.</div>
      <div class="checkbox-group">
        <div class="checkbox-row"><input type="checkbox" id="at1" name="aiTools" value="ChatGPT" /><label for="at1">ChatGPT</label></div>
        <div class="checkbox-row"><input type="checkbox" id="at2" name="aiTools" value="Microsoft Copilot" /><label for="at2">Microsoft Copilot</label></div>
        <div class="checkbox-row"><input type="checkbox" id="at3" name="aiTools" value="Google Gemini" /><label for="at3">Google Gemini</label></div>
        <div class="checkbox-row"><input type="checkbox" id="at4" name="aiTools" value="Claude" /><label for="at4">Claude</label></div>
        <div class="checkbox-row"><input type="checkbox" id="at5" name="aiTools" value="Midjourney / Image AI" /><label for="at5">Midjourney / Image AI</label></div>
        <div class="checkbox-row"><input type="checkbox" id="at6" name="aiTools" value="None" /><label for="at6">None</label></div>
        <div class="checkbox-row"><input type="checkbox" id="at7" name="aiTools" value="Other" /><label for="at7">Other (please specify)</label><input type="text" id="atOther" class="other-text" placeholder="Please specify..." /></div>
      </div>
      <div class="field-error" id="aiToolsErr">Please select at least one option.</div>
    </div>

    <div class="question">
      <div class="question-label">7. What has been your biggest barrier to using AI more effectively? <span class="required">*</span></div>
      <div class="question-hint">Describe any challenges or concerns.</div>
      <textarea id="biggestBarrier" placeholder="Enter your answer"></textarea>
      <div class="field-error" id="biggestBarrierErr">Please describe your biggest barrier.</div>

    <div class="question">
      <div class="question-label">8. Is there anything else you'd like us to know to better support you?</div>
      <textarea id="anythingElse" placeholder="Enter your answer"></textarea>
    </div>

    <button type="submit" id="submitBtn">Submit</button>
    <div id="status"></div>
  </form>

  <script>
    function wireOther(cbId, textId) {
      const cb = document.getElementById(cbId);
      const txt = document.getElementById(textId);
      cb.addEventListener('change', () => {
        txt.style.display = cb.checked ? 'inline-block' : 'none';
        if (!cb.checked) txt.value = '';
      });
    }
    wireOther('sv5', 'svOther');
    wireOther('ah7', 'ahOther');
    wireOther('at7', 'atOther');

    const chk = (id) => document.getElementById(id).checked;
    const txt = (id) => document.getElementById(id).value.trim() || null;

    const form     = document.getElementById('regForm');
    const btn      = document.getElementById('submitBtn');
    const statusEl = document.getElementById('status');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      statusEl.className = '';
      statusEl.style.display = 'none';

      const fullName       = document.getElementById('fullName').value.trim();
      const emailEl        = document.getElementById('email');
      const email          = emailEl.value.trim();
      const phone          = document.getElementById('phone').value.trim() || null;
      const biggestBarrier = txt('biggestBarrier');
      const anythingElse   = txt('anythingElse');

      const svSelected = chk('sv1') || chk('sv2') || chk('sv3') || chk('sv4') || chk('sv5');
      const ahSelected = chk('ah1') || chk('ah2') || chk('ah3') || chk('ah4') || chk('ah5') || chk('ah6') || chk('ah7');
      const atSelected = chk('at1') || chk('at2') || chk('at3') || chk('at4') || chk('at5') || chk('at6') || chk('at7');

      let valid = true;
      function setErr(id, show) { document.getElementById(id).style.display = show ? 'block' : 'none'; }
      if (!fullName)                         { setErr('fullNameErr',      true);  valid = false; } else { setErr('fullNameErr',      false); }
      if (!email || !emailEl.validity.valid) { setErr('emailErr',         true);  valid = false; } else { setErr('emailErr',         false); }
      if (!svSelected)                       { setErr('sessionValueErr',  true);  valid = false; } else { setErr('sessionValueErr',  false); }
      if (!ahSelected)                       { setErr('aiHelpAreasErr',   true);  valid = false; } else { setErr('aiHelpAreasErr',   false); }
      if (!atSelected)                       { setErr('aiToolsErr',       true);  valid = false; } else { setErr('aiToolsErr',       false); }
      if (!biggestBarrier)                   { setErr('biggestBarrierErr',true);  valid = false; } else { setErr('biggestBarrierErr',false); }
      if (!valid) return;

      btn.disabled = true;
      btn.textContent = 'Submitting…';

      const payload = {
        fullName, email, phone,
        // Q4
        sv_makeMoreMoney:           chk('sv1'),
        sv_saveTime:                chk('sv2'),
        sv_reduceExpenses:          chk('sv3'),
        sv_closeBlindSpots:         chk('sv4'),
        sv_otherText:               chk('sv5') ? txt('svOther') : null,
        // Q5
        ah_workProductivity:        chk('ah1'),
        ah_businessOperations:      chk('ah2'),
        ah_marketingContent:        chk('ah3'),
        ah_careerGrowth:            chk('ah4'),
        ah_personalLifeEfficiency:  chk('ah5'),
        ah_learningAIFundamentals:  chk('ah6'),
        ah_otherText:               chk('ah7') ? txt('ahOther') : null,
        // Q6
        at_chatGPT:                 chk('at1'),
        at_microsoftCopilot:        chk('at2'),
        at_googleGemini:            chk('at3'),
        at_claude:                  chk('at4'),
        at_midjourneyImageAI:       chk('at5'),
        at_none:                    chk('at6'),
        at_otherText:               chk('at7') ? txt('atOther') : null,
        biggestBarrier, anythingElse
      };

      try {
        const res = await fetch('${SUBMIT_URL}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          statusEl.textContent = 'Thank you! Your response has been recorded.';
          statusEl.className = 'success';
          statusEl.style.display = 'block';
          form.reset();
          ['svOther','ahOther','atOther'].forEach(id => { document.getElementById(id).style.display = 'none'; });
        } else {
          const err = await res.json().catch(() => ({}));
          statusEl.textContent = err.message || 'Something went wrong. Please try again.';
          statusEl.className = 'error';
          statusEl.style.display = 'block';
        }
      } catch (_) {
        statusEl.textContent = 'Network error. Please check your connection and try again.';
        statusEl.className = 'error';
        statusEl.style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Submit';
      }
    });
  </script>
</body>
</html>`;

app.http('contactForm', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'contactForm',
  handler: async (request, context) => {
    context.log('Serving contact form HTML');
    return {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'ALLOWALL',
        'Content-Security-Policy': "frame-ancestors *"
      },
      body: formHtml
    };
  }
});
