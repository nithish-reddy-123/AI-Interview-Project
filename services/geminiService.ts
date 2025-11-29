
import { GoogleGenAI, Type } from "@google/genai";
import type { Difficulty, InterviewSession, Question } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = 'gemini-2.5-flash';

const infoExtractionSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: 'The full name of the candidate.' },
        email: { type: Type.STRING, description: 'The email address of the candidate.' },
        phone: { type: Type.STRING, description: 'The phone number of the candidate.' },
    },
    required: ['name', 'email', 'phone'],
};

export const extractInfoFromResume = async (fileContent: string, mimeType: string) => {
  try {
    const response = await ai.models.generateContent({
        model,
        contents: {
            parts: [
                {
                    inlineData: {
                        data: fileContent,
                        mimeType: mimeType,
                    },
                },
                {
                    text: 'Extract the name, email, and phone number from this resume. If a value is missing, return an empty string for that field.',
                },
            ],
        },
        config: {
            responseMimeType: 'application/json',
            responseSchema: infoExtractionSchema,
        },
    });
    
    return JSON.parse(response.text);

  } catch (error) {
    console.error("Error extracting resume info:", error);
    return { name: '', email: '', phone: '' };
  }
};


export const generateQuestion = async (difficulty: Difficulty, existingQuestions: string[]): Promise<string> => {
    const prompt = `
        Generate one ${difficulty} interview question for a full stack developer role with expertise in React and Node.js.
        The question should be technical and relevant.
        Do not repeat any of these previously asked questions:
        ${existingQuestions.join('\n- ')}
        
        Return only the question text.
    `;
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text.trim();
    } catch(e) {
        console.error("Error generating question:", e);
        return "Sorry, I couldn't generate a question. Let's try skipping to the next one.";
    }
};

const answerEvaluationSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.NUMBER, description: 'A score from 1 (poor) to 10 (excellent) for the answer.' },
        feedback: { type: Type.STRING, description: 'A brief, one-sentence feedback on the answer.' },
    },
    required: ['score', 'feedback'],
}

export const evaluateAnswer = async (question: string, answer: string): Promise<{ score: number, feedback: string }> => {
    const prompt = `
        Question: "${question}"
        Candidate's Answer: "${answer}"

        Please evaluate the candidate's answer. Provide a score from 1 to 10 and a brief one-sentence feedback.
    `;
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: answerEvaluationSchema,
            },
        });
        return JSON.parse(response.text);
    } catch (e) {
        console.error("Error evaluating answer:", e);
        return { score: 0, feedback: "Could not evaluate answer due to an error." };
    }
}

const finalSummarySchema = {
    type: Type.OBJECT,
    properties: {
        finalScore: { type: Type.NUMBER, description: 'The final calculated overall score out of 100.' },
        summary: { type: Type.STRING, description: 'A short paragraph (2-3 sentences) summarizing the candidate\'s performance, highlighting strengths and weaknesses.' },
    },
    required: ['finalScore', 'summary'],
}

export const generateFinalSummary = async (interview: InterviewSession): Promise<{ finalScore: number; summary: string; }> => {
    const qaPairs = interview.questions.map((q, i) => {
        const answer = interview.answers[i];
        return `
            Question ${i + 1} (${q.difficulty}): ${q.text}
            Answer: ${answer.text}
            Score: ${answer.score}/10
            Feedback: ${answer.feedback}
        `;
    }).join('\n---\n');

    const prompt = `
        Based on the following interview transcript, provide a final summary of the candidate's performance and an overall score out of 100.
        
        Candidate: ${interview.candidate.name}

        Transcript:
        ${qaPairs}

        Provide a concise summary and a final score.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: finalSummarySchema,
            }
        });
        const result = JSON.parse(response.text);
        return { finalScore: result.finalScore, summary: result.summary };
    } catch (e) {
        console.error("Error generating final summary:", e);
        const fallbackScore = interview.answers.reduce((acc, a) => acc + (a.score || 0), 0) / interview.answers.length * 10;
        return { finalScore: Math.round(fallbackScore), summary: "Could not generate AI summary due to an error." };
    }
}
