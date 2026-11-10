const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') || '';

export const parseDictation = async (transcript: string, students: string[]): Promise<any[]> => {
  const prompt = `You are an expert AI grading assistant. The teacher dictated the following text to grade students from this class: [${students.join(', ')}]. \n\nDictation text: "${transcript}"\n\nReturn ONLY a valid JSON array of objects. ONLY include students who were EXPLICITLY MENTIONED in the dictation text! Do NOT include students from the class list if they were not spoken. Format exactly like this: [{"name": "Exact Name From List", "grade": 5, "score": 45}]. If a score or points are mentioned (e.g. "45 pont"), extract it as "score". If a student IS mentioned in the dictation but no specific grade or score is given for them, set their "grade" to 0. Map spoken grades (e.g. "ötös" -> 5) to numbers. No markdown blocks, no backticks, just the raw JSON string array.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
      })
  });

  const jsonResponse = await response.json();
  if (!response.ok) {
    throw new Error(jsonResponse.error?.message || 'API Error during dictation parsing');
  }
  
  if (!jsonResponse.candidates || jsonResponse.candidates.length === 0) {
    return [];
  }

  let aiText = jsonResponse.candidates[0].content.parts[0].text;
  aiText = aiText.replace(/```json/gi, '').replace(/```/g, '').trim();
  
  try {
    return JSON.parse(aiText);
  } catch (e) {
    console.error("Failed to parse Gemini JSON:", aiText);
    throw new Error("Sikertelen AI értelmezés. Kérlek diktáld tisztábban!");
  }
};
