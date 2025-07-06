const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  static getSummarizationPrompt(videoTitle, channelName, transcript) {
    return `You are an expert content analyst and summarizer. Your task is to create a comprehensive summary of a YouTube video based on its transcript.

VIDEO INFORMATION:
- Title: ${videoTitle}
- Channel: ${channelName}

TRANSCRIPT:
${transcript}

Please create a detailed summary with the following structure:

1. EXECUTIVE SUMMARY (2-3 sentences):
   Provide a concise overview of the main topic and key takeaways.

2. KEY POINTS (5-8 bullet points):
   - Extract the most important concepts, facts, or insights
   - Focus on actionable information and valuable insights
   - Include specific details, numbers, or examples mentioned
   - Highlight any surprising or counterintuitive findings

3. DETAILED SUMMARY (3-4 paragraphs):
   - Provide a comprehensive breakdown of the content
   - Organize information logically with clear sections
   - Include context and background information when relevant
   - Mention any important quotes, statistics, or examples
   - Address the main arguments or points made in the video

GUIDELINES:
- Be objective and factual
- Maintain the original tone and context
- Include specific details and examples from the transcript
- Focus on the most valuable and informative content
- Avoid repetition between sections
- Use clear, professional language
- If the video is technical, explain concepts in accessible terms
- If the video is educational, emphasize learning outcomes
- If the video is entertainment, focus on the main themes and highlights

Please format your response as JSON with the following structure:
{
  "executive": "Executive summary here",
  "keyPoints": ["Point 1", "Point 2", "Point 3", ...],
  "detailedSummary": "Detailed summary paragraphs here"
}`;
  }

  async generateSummary(videoTitle, channelName, transcript) {
    try {
      const prompt = GeminiService.getSummarizationPrompt(videoTitle, channelName, transcript);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try to parse as JSON, if it fails, create a structured response
      try {
        const summary = JSON.parse(text);
        return {
          executive: summary.executive || 'Summary not available',
          keyPoints: summary.keyPoints || [],
          detailedSummary: summary.detailedSummary || 'Detailed summary not available'
        };
      } catch (parseError) {
        // If JSON parsing fails, create a structured response from the text
        console.log('Failed to parse JSON response, creating structured response');
        return this.createStructuredResponse(text);
      }
    } catch (error) {
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }

  createStructuredResponse(text) {
    // Fallback method to create structured response from text
    const lines = text.split('\n').filter(line => line.trim());
    
    let executive = '';
    let keyPoints = [];
    let detailedSummary = '';

    let currentSection = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.toLowerCase().includes('executive') || trimmedLine.toLowerCase().includes('overview')) {
        currentSection = 'executive';
        continue;
      } else if (trimmedLine.toLowerCase().includes('key point') || trimmedLine.toLowerCase().includes('main point')) {
        currentSection = 'keyPoints';
        continue;
      } else if (trimmedLine.toLowerCase().includes('detailed') || trimmedLine.toLowerCase().includes('summary')) {
        currentSection = 'detailedSummary';
        continue;
      }

      if (currentSection === 'executive' && trimmedLine) {
        executive += trimmedLine + ' ';
      } else if (currentSection === 'keyPoints' && trimmedLine.startsWith('-')) {
        keyPoints.push(trimmedLine.substring(1).trim());
      } else if (currentSection === 'detailedSummary' && trimmedLine) {
        detailedSummary += trimmedLine + ' ';
      }
    }

    return {
      executive: executive.trim() || 'Executive summary not available',
      keyPoints: keyPoints.length > 0 ? keyPoints : ['Key points not available'],
      detailedSummary: detailedSummary.trim() || 'Detailed summary not available'
    };
  }

  async generateTags(videoTitle, channelName, summary) {
    try {
      const prompt = `Based on the following video information, generate 5-8 relevant tags:

Title: ${videoTitle}
Channel: ${channelName}
Summary: ${summary.executive}

Generate tags that are:
- Relevant to the video content
- Specific and descriptive
- Useful for categorization
- Include both broad and specific terms

Return only the tags as a comma-separated list, no additional text.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      return text.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } catch (error) {
      console.error('Failed to generate tags:', error);
      return [];
    }
  }
}

module.exports = GeminiService; 