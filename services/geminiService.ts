
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StoryboardScript, Shot, AspectRatio, ImageSize, Language, CharacterProfile, VISUAL_STYLES, ChatMessage, StoryConcept } from "../types";

export class GeminiService {
  /**
   * Always create a new client instance right before use to ensure the most up-to-date API key is used.
   */
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
      ? `THE CHARACTER BIBLE (STRICTLY ADHERE TO THESE BIOGRAPHIES): ${characters.map(c => `[ID: ${c.id}] Name: ${c.name}, Age: ${c.age || 'N/A'}, Gender: ${c.gender || 'N/A'}, Occupation: ${c.occupation || 'N/A'}, Visual Description: ${c.keyFeatures.join(', ')}, Bio: ${c.description}`).join('; ')}`
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
      4. "visualPrompt" MUST act as a precise image generation prompt. It must explicitly include the style keyword "${styleName}" and detailed descriptions of the lighting, camera angle, and background textures.
      5. CHARACTER PERSISTENCE: If a character from the "CHARACTER BIBLE" is in the shot, you MUST include their full physical traits, age, and gender in the "visualPrompt". Do not just say their name. Describe their features exactly as provided to ensure the AI generates the same person every time.
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
    referenceImages?: string[], 
    characters?: CharacterProfile[],
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

    if (characters && shot.characterInvolved) {
      const char = characters.find(c => c.id === shot.characterInvolved);
      if (char) {
        characterEmphasis = `[CHARACTER IDENTITY - HIGH PRIORITY]: 
        Name: ${char.name}, ${char.age || ''}y/o ${char.gender || ''} ${char.occupation || ''}. 
        Core Visual Traits (Must Include): ${char.keyFeatures.join(', ')}. 
        Visual Anchor: Consistent facial structure and attire.`;
        
        if (char.referenceImageUrl) {
          const base64 = char.referenceImageUrl;
          const data = base64.includes('base64,') ? base64.split('base64,')[1] : base64;
          parts.push({ inlineData: { data: data, mimeType: 'image/png' } });
        }
      }
    }

    if (referenceImages && referenceImages.length > 0) {
      referenceImages.forEach(base64 => {
        const data = base64.includes('base64,') ? base64.split('base64,')[1] : base64;
        parts.push({ inlineData: { data: data, mimeType: 'image/png' } });
      });
    }

    // ENHANCED STYLE ANCHORING
    const masterPrompt = `[STORYBOARD TASK] - Shot #${shot.shotNumber}: ${shot.shotType}
    
[SCENE DESCRIPTION]:
${shot.visualPrompt}

${characterEmphasis}

[VISUAL STYLE SPECIFICATION - CRITICAL CONSISTENCY]:
Aesthetic: ${styleName}
Style Keywords: ${styleKeywords}
${customStyleDescription ? `Custom Creative Direction: ${customStyleDescription}` : ""}

[TECHNICAL DIRECTIVES]:
- Cinematic 8k resolution, photorealistic textures, sharp focus.
- Match reference image color palette and lighting temperature exactly.
- Maintain consistent atmospheric depth and lens characteristics (${aspectRatio} perspective).
- Lighting Style: ${globalStyle === 'noir' ? 'Hard shadows, low-key lighting, chiaroscuro' : 'Volumetric lighting, balanced exposure'}.
- NO TEXT, NO WATERMARKS.`;

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
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned");
  }

  async generateCharacterReference(character: CharacterProfile, globalStyle: string): Promise<string> {
    const ai = this.getClient();
    const styleObj = VISUAL_STYLES.find(s => s.id === globalStyle);
    const styleKeywords = styleObj ? `${styleObj.name.en} style, ${styleObj.description.en}` : globalStyle;
    
    const prompt = `CHARACTER REFERENCE CONCEPT ART:
    Subject: ${character.name}
    Age: ${character.age || 'Unknown'}
    Gender: ${character.gender || 'Unknown'}
    Occupation: ${character.occupation || 'Unknown'}
    Physical Traits: ${character.keyFeatures.join(', ')}
    Artistic Style: ${styleKeywords}
    
    Composition: A clean character design sheet. Split view showing front and profile. Neutral lighting. Plain studio background. 8k resolution, high fidelity character model.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Failed to generate character reference");
  }

  async editShotImage(base64Image: string, editPrompt: string): Promise<string> {
    const ai = this.getClient();
    const data = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: data, mimeType: 'image/png' } },
          { text: `Edit this storyboard frame as follows: ${editPrompt}. Maintain style consistency.` }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Edit failed");
  }

  async animateToVideo(base64Image: string, prompt: string, aspectRatio: '16:9' | '9:16'): Promise<string> {
    const ai = this.getClient();
    const data = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
    
    try {
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || 'Subtle cinematic camera movement and character breathing',
        image: {
          imageBytes: data,
          mimeType: 'image/png'
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio
        }
      });

      let attempts = 0;
      const maxAttempts = 60; 
      
      while (!operation.done && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
        attempts++;
      }

      if (!operation.done) {
        throw new Error("Video generation timed out.");
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) {
        throw new Error("Video generation failed.");
      }

      const fetchResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!fetchResponse.ok) {
        throw new Error(`Failed to download video: ${fetchResponse.statusText}`);
      }
      const blob = await fetchResponse.blob();
      return URL.createObjectURL(blob);
    } catch (error: any) {
      console.error("animateToVideo error:", error);
      throw error;
    }
  }

  async chatWithGrounding(message: string, history: ChatMessage[]): Promise<ChatMessage> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const links = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({ title: chunk.web?.title || 'Source', uri: chunk.web?.uri || '' }));

    return {
      role: 'model',
      text: response.text || "I'm sorry, I couldn't process that.",
      groundingLinks: links
    };
  }
}

export const geminiService = new GeminiService();
