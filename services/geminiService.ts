

// FIX: Import Modality for use with responseModalities
import { GoogleGenAI, Modality } from "@google/genai";
import { HealthData, ChatMessage } from '../types';

let ai: GoogleGenAI;

const getAIClient = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            console.error("API_KEY environment variable not set.");
            // In a real app, you might throw an error or handle this case more gracefully.
            // For this demo, we'll proceed, but API calls will fail.
             throw new Error("API Key is missing. Please set the API_KEY environment variable.");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};


const callApi = async <T,>(prompt: string, systemInstruction: string): Promise<string> => {
    try {
        const aiClient = getAIClient();
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                systemInstruction: systemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API call failed:", error);
        return "ERROR: The AI service is currently unavailable. Please check configuration and try again later.";
    }
};

export const generateRecommendations = (analysisText: string) => {
    const systemInstruction = "SYSTEM: You are a health data analysis model. Your function is to provide objective, actionable recommendations based on the provided user health summary. Output format must be a short list of 2-3 items. Language: German. Tone: Professional, clear, concise.";
    const userPrompt = `ANALYSIS INPUT: "${analysisText}". \n\nGENERATE RECOMMENDATIONS.`;
    return callApi(userPrompt, systemInstruction);
};

export const generateWeeklySummary = (data: HealthData) => {
    const systemInstruction = "SYSTEM: You are a health data summarization model. Your function is to generate a concise weekly performance report based on key health metrics. The report should be encouraging but data-focused. Output format: A brief paragraph (2-4 sentences). Language: German. Tone: Professional, analytical.";
    const userPrompt = `WEEKLY DATA: Health Score (Avg): ${data.score}/100, Steps (Avg): ${data.steps.toLocaleString('de-DE')}, Sleep (Avg): ${data.sleepHours} hours. \n\nGENERATE WEEKLY SUMMARY.`;
    return callApi(userPrompt, systemInstruction);
};

export const getCoachResponse = async (history: ChatMessage[], data: HealthData) => {
    const systemInstruction = "SYSTEM: You are an AI health and fitness coach. Your function is to provide guidance, answer questions, and motivate the user. You have access to the user's current health data for context. Respond helpfully and accurately. Keep responses concise. Language: German. Tone: Supportive but professional.";
    
    const healthDataContext = `CURRENT HEALTH DATA:
- Heart Rate: ${data.hr} BPM
- Steps Today: ${data.steps}
- Sleep Last Night: ${data.sleepHours} hours
- Stress Level: ${data.stress}/100
- Health Score: ${data.score}/100`;

    const fullPrompt = `${healthDataContext}\n\nCONVERSATION HISTORY:\n${history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}\n\nUSER: ${history[history.length - 1].text}\n\nMODEL:`;
    
    return callApi(fullPrompt, systemInstruction);
};

export const generateTtsAudio = async (text: string): Promise<string | null> => {
    try {
        const aiClient = getAIClient();
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Sage auf Deutsch mit einer klaren, professionellen Stimme: ${text}` }] }],
            config: {
                // FIX: Use Modality.AUDIO enum instead of a magic string 'AUDIO'.
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        
        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if(audioData) {
            return audioData;
        }
        return null;

    } catch (error) {
        console.error("Gemini TTS API call failed:", error);
        return null;
    }
};
