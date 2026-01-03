
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StoryboardScript, Shot, AspectRatio, ImageSize, Language, CharacterProfile, KeyItem, VISUAL_STYLES, ChatMessage, StoryConcept } from "../types";

export class GeminiService {
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async refineConcept(wizardData: any, language: Language): Promise<StoryConcept> {
    const ai = this.getClient();
    const prompt = `You are a world-class screenwriter and narrative designer. Your goal is to refine raw story inputs into a professional cinematic premise.
    
    GENRE: ${wizardData.genre}
    PRIMARY CONFLICT: ${wizardData.conflict}
    PROTAGONIST: ${wizardData.protagonist}
    INITIAL SEED: ${wizardData.seed}
    
    OUTPUT LANGUAGE: ${language === 'zh' ? 'Simplified Chinese' : 'English'}
    
    Please provide a catchy title and a high-stakes, 2-3 sentence premise that defines the inciting incident and the protagonist's goal.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            premise: { type: Type.STRING }
          },
          required: ["title", "premise"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  }

  async generateScriptFromConcept(concept: StoryConcept, style: string, language: Language, characters?: CharacterProfile[]): Promise<StoryboardScript> {
    return this.generateScript(concept.premise, style, language, characters);
  }

  async generateScript(prompt: string, style: string, language: Language, characters?: CharacterProfile[]): Promise<StoryboardScript> {
    const ai = this.getClient();
    const languageInstruction = language === 'zh' 
      ? "Please output all text content (title, theme, shotType, description, dialogue) in Simplified Chinese." 
      : "Please output all text content in English.";

    const styleObj = VISUAL_STYLES.find(s => s.id === style);
    const styleName = styleObj ? styleObj.name.en : "Custom Aesthetic";
    const styleDesc = styleObj ? styleObj.description.en : style;

    const charContext = characters && characters.length > 0 
      ? `THE CHARACTER BIBLE (STRICTLY ADHERE TO THESE BIOGRAPHIES): ${characters.map(c => `[ID: ${c.id}] Name: ${c.name}, Bio: ${c.description}`).join('; ')}`
      : "";

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `You are an expert film director and storyboard artist. Create a professional storyboard script.
      
      CORE STORY IDEA: "${prompt}"
      MASTER VISUAL STYLE: ${styleName}
      STYLE DEFINITION: ${styleDesc}
      
      ${charContext}
      
      TASK INSTRUCTIONS:
      1. Generate a sequence of 6-8 shots that tell a coherent story.
      2. ${languageInstruction}
      3. CRITICAL CONSISTENCY RULE: Every "visualPrompt" MUST be in English.
      4. "visualPrompt" MUST act as a precise image generation prompt. It must explicitly include the style keyword "${styleName}" and detailed descriptions.
      5. CHARACTER PERSISTENCE: If a character from the "CHARACTER BIBLE" is in the shot, you MUST include their full physical traits in the "visualPrompt". Describe their features exactly as provided.
      6. "characterInvolved" must contain the ID of the primary character featured in that shot.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            theme: { type: Type.STRING },
            visualStyle: { type: Type.STRING },
            shots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  shotNumber: { type: Type.INTEGER },
                  shotType: { type: Type.STRING },
                  description: { type: Type.STRING },
                  visualPrompt: { type: Type.STRING },
                  dialogue: { type: Type.STRING },
                  characterInvolved: { type: Type.STRING },
                },
                required: ["shotNumber", "shotType", "description", "visualPrompt"]
              }
            }
          },
          required: ["title", "theme", "visualStyle", "shots"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      ...data,
      characterProfiles: characters,
      shots: data.shots.map((s: any) => ({
        ...s,
        id: crypto.randomUUID(),
        status: 'idle'
      }))
    };
  }

  async generateShotImage(
    shot: Shot, 
    globalStyle: string, 
    aspectRatio: AspectRatio, 
    imageSize: ImageSize, 
    referenceImages: string[] = [], 
    characters: CharacterProfile[] = [],
    keyItems: KeyItem[] = [],
    customStyleDescription?: string
  ): Promise<string> {
    const ai = this.getClient();
    const isPro = imageSize !== '1K';
    const model = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    
    const styleObj = VISUAL_STYLES.find(s => s.id === globalStyle);
    const styleName = styleObj ? styleObj.name.en : "Custom Style";
    const styleKeywords = styleObj ? styleObj.description.en : globalStyle;
    
    const parts: any[] = [];
    let characterEmphasis = "";
    let itemEmphasis = "";

    // 1. Add Shot Base Reference (Img2Img)
    if (shot.baseReferenceImage) {
      const data = shot.baseReferenceImage.split('base64,')[1] || shot.baseReferenceImage;
      parts.push({ inlineData: { data, mimeType: 'image/png' } });
    }

    // 2. Add Character Reference
    if (shot.characterInvolved) {
      const char = characters.find(c => c.id === shot.characterInvolved);
      if (char) {
        characterEmphasis = `[CHARACTER IDENTITY]: Name: ${char.name}. Traits: ${char.keyFeatures.join(', ')}. ${char.description}.`;
        if (char.referenceImageUrl) {
          const data = char.referenceImageUrl.split('base64,')[1] || char.referenceImageUrl;
          parts.push({ inlineData: { data, mimeType: 'image/png' } });
        }
      }
    }

    // 3. Add Key Items References
    if (shot.itemsInvolved && shot.itemsInvolved.length > 0) {
      shot.itemsInvolved.forEach(itemId => {
        const item = keyItems.find(i => i.id === itemId);
        if (item) {
          itemEmphasis += `[KEY ITEM]: ${item.name} - ${item.description}. `;
          if (item.imageUrl) {
            const data = item.imageUrl.split('base64,')[1] || item.imageUrl;
            parts.push({ inlineData: { data, mimeType: 'image/png' } });
          }
        }
      });
    }

    // 4. Add Global Reference Images
    referenceImages.forEach(base64 => {
      const data = base64.split('base64,')[1] || base64;
      parts.push({ inlineData: { data, mimeType: 'image/png' } });
    });

    const masterPrompt = `STORYBOARD SHOT GENERATION
    
[SHOT CONFIG]: ${shot.shotType}, Shot #${shot.shotNumber}
[SCENE]: ${shot.visualPrompt}
${characterEmphasis}
${itemEmphasis}

[AESTHETIC]: ${styleName} (${styleKeywords})
${customStyleDescription ? `[STYLE DIRECTION]: ${customStyleDescription}` : ""}

[DIRECTIVE]: Match composition and lighting to the provided images. Maintain extreme character and item consistency. Use ${aspectRatio} ratio. High quality, cinematic.`;

    parts.push({ text: masterPrompt });

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: isPro ? imageSize : undefined
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image returned");
  }

  async generateCharacterReference(character: CharacterProfile, globalStyle: string): Promise<string> {
    const ai = this.getClient();
    const styleObj = VISUAL_STYLES.find(s => s.id === globalStyle);
    const styleKeywords = styleObj ? `${styleObj.name.en} style` : globalStyle;
    
    const prompt = `CHARACTER CONCEPT DESIGN SHEET:
    Name: ${character.name}, Traits: ${character.keyFeatures.join(', ')}.
    Style: ${styleKeywords}. Front and side view, neutral background.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Failed character generation");
  }

  async editShotImage(base64Image: string, editPrompt: string): Promise<string> {
    const ai = this.getClient();
    const data = base64Image.split('base64,')[1] || base64Image;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data, mimeType: 'image/png' } },
          { text: `Edit this image: ${editPrompt}` }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Edit failed");
  }

  async animateToVideo(base64Image: string, prompt: string, aspectRatio: '16:9' | '9:16'): Promise<string> {
    const ai = this.getClient();
    const data = base64Image.split('base64,')[1] || base64Image;
    
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt || 'Cinematic movement',
      image: { imageBytes: data, mimeType: 'image/png' },
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const fetchResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await fetchResponse.blob();
    return URL.createObjectURL(blob);
  }

  async chatWithGrounding(message: string, history: ChatMessage[]): Promise<ChatMessage> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: { tools: [{ googleSearch: {} }] }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const links = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({ title: chunk.web?.title || 'Source', uri: chunk.web?.uri || '' }));

    return {
      role: 'model',
      text: response.text || "Could not process.",
      groundingLinks: links
    };
  }
}

export const geminiService = new GeminiService();
