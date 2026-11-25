/**
 * Schola Gemini AI Service
 * Kliensoldali Gemini API kliens BYOK (Bring Your Own Key) modellben.
 * Az API kulcs kizárólag a felhasználó böngészőjében (localStorage) tárolódik.
 */

const STORAGE_KEY = 'schola_gemini_api_key';
const STORAGE_MODEL = 'schola_gemini_model';

export const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Legújabb, szupergyors és pontos - Ajánlott)' },
  { id: 'gemini-flash-lite-latest', name: 'Gemini Flash-Lite (Kiemelkedően gyors és gazdaságos)' }
];

export const geminiService = {
  getApiKey() {
    return localStorage.getItem(STORAGE_KEY) || '';
  },

  setApiKey(key) {
    if (!key) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, key.trim());
    }
  },

  removeApiKey() {
    localStorage.removeItem(STORAGE_KEY);
  },

  hasApiKey() {
    return Boolean(this.getApiKey());
  },

  getModel() {
    const saved = localStorage.getItem(STORAGE_MODEL);
    if (!saved || ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-flash-lite'].includes(saved)) {
      localStorage.setItem(STORAGE_MODEL, 'gemini-2.5-flash');
      return 'gemini-2.5-flash';
    }
    return saved;
  },

  setModel(modelId) {
    localStorage.setItem(STORAGE_MODEL, modelId);
  },

  /**
   * Teszteli az API kapcsolatot egy minimális kéréssel (auto-fallbackkel)
   */
  async testConnection(customKey = null) {
    const key = customKey || this.getApiKey();
    if (!key) {
      return { success: false, error: 'Nincs megadva Gemini API kulcs.' };
    }

    const preferredModel = this.getModel();
    const candidateModels = [
      preferredModel,
      'gemini-2.5-flash',
      'gemini-flash-lite-latest'
    ].filter((m, i, arr) => arr.indexOf(m) === i && !['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-flash-lite'].includes(m));

    for (const model of candidateModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: 'Válaszolj egyetlen szóval: MŰKÖDIK' }]
              }
            ],
            generationConfig: {
              maxOutputTokens: 10,
              temperature: 0.1
            }
          })
        });

        const data = await response.json();

        if (response.ok) {
          if (model !== preferredModel) {
            this.setModel(model);
          }
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'OK';
          return { success: true, message: `Sikeres kapcsolat (${model})! Modell válasza: ${reply}` };
        }

        const errorMsg = data?.error?.message || `HTTP hiba: ${response.status}`;
        if (response.status === 404 || /not found|unsupported|not supported|no longer available/i.test(errorMsg)) {
          // Próbáljuk a következő elérhető modellt
          continue;
        }

        if (response.status === 400 || response.status === 403) {
          return { success: false, error: `Érvénytelen API kulcs vagy hozzáférés megtagadva: ${errorMsg}` };
        }

        return { success: false, error: errorMsg };
      } catch (err) {
        return { success: false, error: `Hálózati hiba: ${err.message}` };
      }
    }

    return { success: false, error: 'A megadott kulccsal egyik Gemini modell sem érhető el.' };
  },

  /**
   * Általános generáló függvény automatikus modell-fallbackkel és multimodális (dokumentum/kép) támogatással
   */
  async generateContent({ systemInstruction, prompt, parts = null, temperature = 0.5, maxTokens = 16384, responseMimeType = null, thinkingBudget = null }) {
    const key = this.getApiKey();
    if (!key) {
      throw new Error('Nincs beállítva Gemini API kulcs! Kérlek add meg a Beállítások menüben.');
    }

    const preferredModel = this.getModel();
    const candidateModels = [
      preferredModel,
      'gemini-2.5-flash',
      'gemini-flash-lite-latest'
    ].filter((m, i, arr) => arr.indexOf(m) === i && !['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-flash-lite'].includes(m));

    let lastError = null;

    const userParts = Array.isArray(parts) && parts.length > 0
      ? parts
      : [{ text: prompt || '' }];

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

        const generationConfig = {
          temperature,
          maxOutputTokens: maxTokens
        };

        if (responseMimeType) {
          generationConfig.responseMimeType = responseMimeType;
        }
        if (thinkingBudget !== null && /2\.5/.test(model)) {
          generationConfig.thinkingConfig = { thinkingBudget };
        }

        const body = {
          contents: [
            {
              role: 'user',
              parts: userParts
            }
          ],
          generationConfig
        };

        if (systemInstruction) {
          body.systemInstruction = {
            parts: [{ text: systemInstruction }]
          };
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
          const msg = data?.error?.message || `Hiba (${response.status})`;
          // Ha nem támogatott vagy nincs jogosultság az adott modellhez, próbáljuk a következőt
          if (response.status === 404 || /not found|unsupported|not supported/i.test(msg)) {
            lastError = new Error(`A(z) ${model} modell nem elérhető a kulcsoddal (${msg}).`);
            continue;
          }
          throw new Error(msg);
        }

        const candidate = data?.candidates?.[0];
        const text = (candidate?.content?.parts || []).filter(p => !p.thought && p.text).map(p => p.text).join('');
        if (candidate?.finishReason === 'MAX_TOKENS' && responseMimeType === 'application/json') {
          throw new Error('Az AI válasza megszakadt (túl hosszú). Próbálj kevesebb kérdést kérni.');
        }
        if (!text) {
          throw new Error('A modell üres választ adott vagy a tartalom szűrve lett.');
        }

        // Ha egy másik modell vált be, mentsük el mint alapértelmezettet
        if (model !== preferredModel) {
          this.setModel(model);
        }

        return text;
      } catch (err) {
        lastError = err;
        if (/not found|unsupported|not supported|404/i.test(err.message)) {
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error('Egyik Gemini modell sem volt elérhető a megadott API kulccsal.');
  }
};
