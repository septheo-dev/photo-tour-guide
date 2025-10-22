
import { GoogleGenAI, Modality } from "@google/genai";
import type { LandmarkInfo, GroundingChunk } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface GenerativePart {
    inlineData: {
        data: string;
        mimeType: string;
    };
}

export const analyzeImage = async (imagePart: GenerativePart): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    imagePart,
                    { text: "What is the name of the landmark in this photo? Respond with only the name of the landmark and nothing else." }
                ]
            },
        });
        const text = response.text.trim();
        if (!text) {
            throw new Error("Could not identify the landmark. Please try another photo.");
        }
        return text;
    } catch (error) {
        console.error("Error analyzing image:", error);
        throw new Error("Failed to analyze the image. The landmark might not be recognizable.");
    }
};

export const fetchLandmarkInfo = async (landmarkName: string): Promise<LandmarkInfo> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Tell me about the history and significance of ${landmarkName}. Make it engaging, like a tour guide.`,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        
        const text = response.text;
        const sources: GroundingChunk[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        if (!text) {
            throw new Error("No information could be found for this landmark.");
        }

        return { text, sources };

    } catch (error) {
        console.error("Error fetching landmark info:", error);
        throw new Error(`Failed to fetch information for ${landmarkName}.`);
    }
};

export const generateSpeech = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Read this in an engaging and clear tour guide voice: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Zephyr' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!base64Audio) {
            throw new Error("Audio generation failed, no data received.");
        }

        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw new Error("Failed to generate audio narration.");
    }
};
