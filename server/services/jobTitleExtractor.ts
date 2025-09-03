import Anthropic from '@anthropic-ai/sdk';

const DEFAULT_MODEL_STR = "claude-sonnet-4-20250514";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function extractJobTitle(jobSpecText: string): Promise<string | null> {
  try {
    const prompt = `Extract the job title from this job specification. Return ONLY the job title as plain text, nothing else.

Job Specification:
${jobSpecText.substring(0, 2000)}

If you cannot find a clear job title, return "null".`;

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL_STR,
      max_tokens: 100,
      system: "You are a job title extractor. Return only the exact job title found in the document, or 'null' if not found.",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
    });

    const jobTitle = response.content[0] && response.content[0].type === 'text' 
      ? response.content[0].text?.trim() 
      : null;
    return jobTitle === 'null' ? null : jobTitle;
  } catch (error) {
    console.error("Error extracting job title:", error);
    return null;
  }
}

// Fallback method using regex patterns
export function extractJobTitleFromText(text: string): string | null {
  // Common patterns for job titles in job specifications
  const patterns = [
    /(?:Job Title|Position|Role):\s*([^\n]+)/i,
    /(?:Title|Position Title):\s*([^\n]+)/i,
    /^(?:Higher Executive Officer|HEO|Executive Officer|EO|Assistant Principal|AP|Principal Officer|PO)\s*[-–]\s*([^\n]+)/mi,
    /^([A-Z][a-zA-Z\s]+(?:Officer|Manager|Director|Administrator|Analyst|Specialist|Coordinator))\s*[-–]/m
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}