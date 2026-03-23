const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash-exp";

export async function generateProductImage(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [{
      parts: [{
        text: `Generate a high-quality realistic photo of: ${prompt}. 
        
Requirements:
- Professional product photography style
- Clean white or neutral background
- Centered product
- High resolution, detailed
- No text, logos, or watermarks
- Realistic lighting and shadows
- Automotive/parts context if applicable

Respond with ONLY a valid JSON object containing a base64 encoded image or image URL, format: {"image": "base64_or_url"}`
      }]
    }],
    generationConfig: {
      responseModalities: "image"
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  
  if (data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
    return {
      imageData: data.candidates[0].content.parts[0].inlineData.data,
      mimeType: data.candidates[0].content.parts[0].inlineData.mimeType
    };
  }

  if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
    const textResponse = data.candidates[0].content.parts[0].text;
    try {
      const parsed = JSON.parse(textResponse);
      return { externalUrl: parsed.image };
    } catch {
      throw new Error("Could not parse Gemini response");
    }
  }

  throw new Error("No image data in Gemini response");
}

export async function generateSearchKeywords(product) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

  const { name, description, brand, model, year, category } = product;
  
  const body = {
    contents: [{
      parts: [{
        text: `Generate 5 effective image search keywords for finding product photos of this car part:

Product: ${name}
Description: ${description || "N/A"}
Brand: ${brand || "N/A"}  
Model: ${model || "N/A"}
Year: ${year || "N/A"}
Category: ${category || "N/A"}

Return ONLY a JSON array of 5 strings, nothing else. Example: ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]`
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 200
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (text) {
    try {
      return JSON.parse(text);
    } catch {
      return text.split(",").map(k => k.trim()).slice(0, 5);
    }
  }

  throw new Error("No keywords in Gemini response");
}