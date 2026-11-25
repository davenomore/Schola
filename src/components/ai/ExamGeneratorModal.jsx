import React, { useState } from 'react';
import { geminiService } from '../../services/geminiService';
import { mathExamSkill } from '../../services/skills/mathExamSkill';

export default function ExamGeneratorModal({ isOpen, onClose, onAddExam, addNotification }) {
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('10. évfolyam');
  const [duration, setDuration] = useState(45);
  const [hasAB, setHasAB] = useState(true);
  const [customNotes, setCustomNotes] = useState('');

  // Workflow állapota
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepLabel, setStepLabel] = useState('');
  const [generatedResult, setGeneratedResult] = useState(null);
  const [editedMarkdown, setEditedMarkdown] = useState('');
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'edit'

  const quickTopics = [
    'Másodfokú egyenletek és függvények',
    'Trigonometrikus összefüggések és szögfüggvények',
    'Exponenciális és logaritmusos egyenletek',
    'Kombinatorika és valószínűségszámítás',
    'Koordinátageometria: kör és egyenes egyenlete',
    'Függvénytranszformációk és határérték'
  ];

  if (!isOpen) return null;

  const hasKey = geminiService.hasApiKey();

  const handleStartWorkflow = async () => {
    if (!topic.trim()) {
      if (addNotification) addNotification('Kérlek add meg a dolgozat témakörét!', 'error');
      return;
    }

    if (!hasKey) {
      if (addNotification) addNotification('Kérlek előbb add meg a Gemini API kulcsodat a Beállításokban!', 'error');
      return;
    }

    setIsRunning(true);
    setGeneratedResult(null);
    setCurrentStep(1);

    try {
      const result = await mathExamSkill.generateExamWorkflow({
        topic: topic.trim(),
        grade,
        durationMinutes: Number(duration),
        hasABGroups: hasAB,
        customInstructions: customNotes.trim(),
        onStepUpdate: ({ step, label }) => {
          setCurrentStep(step);
          setStepLabel(label);
        }
      });

      setGeneratedResult(result);
      setEditedMarkdown(result.markdown);
      setCurrentStep(3);
      if (addNotification) addNotification('A dolgozat és javítókulcs sikeresen elkészült!', 'success');
    } catch (err) {
      if (addNotification) addNotification(err.message, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = editedMarkdown || generatedResult?.markdown || '';
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    if (addNotification) addNotification('Dolgozat szövege vágólapra másolva!', 'success');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const content = editedMarkdown || generatedResult?.markdown || '';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${topic} – Dolgozat</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 30px; line-height: 1.6; color: #000; }
            h1 { font-size: 20px; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px; }
            h2 { font-size: 16px; margin-top: 24px; }
            pre { font-family: inherit; white-space: pre-wrap; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <pre>${content}</pre>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSaveToRadar = () => {
    if (!topic.trim()) return;

    const newExamData = {
      subject: 'Matematika',
      topic: topic.trim(),
      className: grade,
      date: new Date().toISOString().split('T')[0],
      lessonNumber: 1,
      status: 'planned',
      notes: editedMarkdown || generatedResult?.markdown || ''
    };

    if (onAddExam) {
      onAddExam(newExamData);
    }

    if (addNotification) {
      addNotification(`"${topic}" dolgozat hozzáadva a Tervezett oszlophoz!`, 'success');
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      zIndex: 1100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }} onClick={onClose}>
      <div
        className="glass-panel card"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '4px',
          background: 'var(--panel-bg)',
          border: '1px solid var(--panel-border)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--panel-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
              Katedra AI – Dolgozat & Javítókulcs Generátor
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              3 szinten differenciált feladatsor A/B csoporttal és részletes pontozási útmutatóval
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ padding: '6px', color: 'var(--text-secondary)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {!hasKey ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              background: 'var(--bg-color)',
              border: '1px solid var(--panel-border)',
              borderRadius: '4px'
            }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '15px', fontWeight: '600' }}>
                Nincs beállítva Gemini API kulcs
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '500px', margin: '0 auto 16px' }}>
                Az AI dolgozatgeneráláshoz szükséged van egy ingyenes Google Gemini API kulcsra. Ezt a <strong>Katedra AI</strong> menüpont <strong>API Beállítások</strong> fülén adhatod meg.
              </p>
              <button
                onClick={onClose}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '4px' }}
              >
                Értem, beállítom
              </button>
            </div>
          ) : !generatedResult ? (
            /* Beviteli űrlap */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="input-label" style={{ marginBottom: '6px' }}>
                  Dolgozat Témaköre
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="pl. Másodfokú egyenletek és egyenlőtlenségek"
                  className="input-field"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                />
                {/* Gyors témaválasztó címkék */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {quickTopics.map((t) => {
                    const isSelected = topic === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTopic(t)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: `1px solid ${isSelected ? 'var(--text-primary)' : 'var(--panel-border)'}`,
                          background: isSelected ? 'var(--text-primary)' : 'var(--bg-color)',
                          color: isSelected ? 'var(--bg-color)' : 'var(--text-secondary)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="input-label" style={{ marginBottom: '6px' }}>
                    Évfolyam
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="input-field"
                    style={{
                      padding: '8px 10px',
                      borderRadius: '4px',
                      fontSize: '13px'
                    }}
                  >
                    <option value="9. évfolyam">9. évfolyam</option>
                    <option value="10. évfolyam">10. évfolyam</option>
                    <option value="11. évfolyam">11. évfolyam</option>
                    <option value="12. évfolyam">12. évfolyam</option>
                  </select>
                </div>

                <div>
                  <label className="input-label" style={{ marginBottom: '6px' }}>
                    Időtartam
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="input-field"
                    style={{
                      padding: '8px 10px',
                      borderRadius: '4px',
                      fontSize: '13px'
                    }}
                  >
                    <option value="20">20 perc (Röpdolgozat)</option>
                    <option value="45">45 perc (Témazáró)</option>
                    <option value="90">90 perc (Nagydolgozat)</option>
                  </select>
                </div>

                <div>
                  <label className="input-label" style={{ marginBottom: '6px' }}>
                    Csoportok
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    height: '36px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={hasAB}
                      onChange={(e) => setHasAB(e.target.checked)}
                      style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                    />
                    <span>A és B csoport</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="input-label" style={{ marginBottom: '6px' }}>
                  Egyedi pedagógiai szempont (opcionális)
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="pl. Legyen benne Viète-formulás feladat és szöveges mozgásos példa is"
                  className="input-field"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                />
              </div>

              {/* Folyamat indikátor, ha fut */}
              {isRunning && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '4px',
                  background: 'var(--bg-color)',
                  border: '1px solid var(--panel-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid var(--panel-border)',
                    borderTopColor: 'var(--text-primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                      Munkafolyamat ({currentStep}/3. fázis)
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {stepLabel || 'Generálás folyamatban...'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Eredmény nézet */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      border: `1px solid ${activeTab === 'preview' ? 'var(--text-primary)' : 'var(--panel-border)'}`,
                      background: activeTab === 'preview' ? 'var(--text-primary)' : 'transparent',
                      color: activeTab === 'preview' ? 'var(--bg-color)' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Előnézet
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      border: `1px solid ${activeTab === 'edit' ? 'var(--text-primary)' : 'var(--panel-border)'}`,
                      background: activeTab === 'edit' ? 'var(--text-primary)' : 'transparent',
                      color: activeTab === 'edit' ? 'var(--bg-color)' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Szerkesztő (Nyers szöveg)
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="btn-outline"
                    style={{ padding: '5px 10px', borderRadius: '4px', fontSize: '11px' }}
                  >
                    Vágólapra
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="btn-outline"
                    style={{ padding: '5px 10px', borderRadius: '4px', fontSize: '11px' }}
                  >
                    Nyomtatás / PDF
                  </button>
                </div>
              </div>

              {activeTab === 'edit' ? (
                <textarea
                  value={editedMarkdown}
                  onChange={(e) => setEditedMarkdown(e.target.value)}
                  className="input-field"
                  style={{
                    width: '100%',
                    height: '420px',
                    padding: '14px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    resize: 'vertical'
                  }}
                />
              ) : (
                <div style={{
                  height: '420px',
                  overflowY: 'auto',
                  padding: '16px',
                  borderRadius: '4px',
                  border: '1px solid var(--panel-border)',
                  background: 'var(--bg-color)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {editedMarkdown}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--panel-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={onClose}
            className="btn-outline"
            style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '4px' }}
          >
            Bezárás
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            {generatedResult ? (
              <>
                <button
                  onClick={() => setGeneratedResult(null)}
                  className="btn-outline"
                  style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '4px' }}
                >
                  Újragenerálás
                </button>
                <button
                  onClick={handleSaveToRadar}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '4px' }}
                >
                  Mentés a Dolgozat Radarba &rarr;
                </button>
              </>
            ) : (
              <button
                onClick={handleStartWorkflow}
                disabled={isRunning || !topic.trim() || !hasKey}
                className="btn-primary"
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  opacity: isRunning || !topic.trim() || !hasKey ? 0.6 : 1,
                  cursor: isRunning || !topic.trim() || !hasKey ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isRunning ? 'Generálás folyamatban...' : 'Workflow Indítása &rarr;'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
