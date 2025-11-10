
import { GoogleGenAI, Type } from "@google/genai";
import { Message, SenderType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = 'gemini-2.5-flash';

interface InitialChatData {
    welcomeMessage: { sender: string; text: string };
    chatter: { sender: string; text: string }[];
}

export async function fetchInitialChatter(channel: string): Promise<InitialChatData> {
    const prompt = `You are simulating an IRC chat. Generate a welcome message from 'ChanServ' and 4 subsequent realistic chat messages between various users for the channel '${channel}'. Users should have typical IRC nicks (e.g., 'net_surfer', 'Pixel_Pioneer'). The response must be a JSON object that strictly adheres to this schema. Do not include markdown formatting.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        welcomeMessage: {
                            type: Type.OBJECT,
                            properties: {
                                sender: { type: Type.STRING },
                                text: { type: Type.STRING },
                            },
                        },
                        chatter: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    sender: { type: Type.STRING },
                                    text: { type: Type.STRING },
                                },
                            },
                        },
                    },
                },
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error fetching initial chatter:", error);
        // Return fallback data on error
        return {
            welcomeMessage: { sender: "ChanServ", text: `Welcome to ${channel}! The AI service is currently unavailable.` },
            chatter: [],
        };
    }
}

export async function getBotResponse(userMessage: string, channel: string, chatHistory: Message[]): Promise<string> {
    const historyContext = chatHistory
        .slice(-6) // get last 6 messages
        .map(msg => `${msg.sender}: ${msg.text}`)
        .join('\n');

    const prompt = `You are 'GeminiBot', a helpful and friendly assistant in an IRC chat room for the website '${channel}'.
Here is the recent chat history:
${historyContext}

A user has just sent the following message:
You: ${userMessage}

Provide a concise, helpful, and chat-appropriate response as 'GeminiBot'. Keep it brief and conversational.`;
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error getting bot response:", error);
        return "Sorry, I'm having trouble connecting to my brain right now.";
    }
}
