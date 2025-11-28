/**
 * Google Gemini API integration for breach detection
 * Uses free Gemini Pro API to scan for potential data breaches
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Using Gemini 1.5 Pro - Best model for students (free tier includes this!)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

/**
 * Scan for potential breach using Gemini API
 * @param {string} fileName - File name
 * @param {string} fileType - File type
 * @param {string} uploadDate - Upload date
 * @returns {Promise<{status: string, details: string, confidence: number}>}
 */
export async function scanForBreach(fileName, fileType, uploadDate) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
        return {
            status: 'ERROR',
            details: 'Gemini API key not configured',
            confidence: 0
        };
    }

    try {
        const prompt = `You are a cybersecurity analyst helping detect potential data breaches. 
    
Analyze if a file with the following details might have been exposed in any known data breaches or leaks:

File Name: ${fileName}
File Type: ${fileType}
Upload Date: ${uploadDate}

Based on the file name and type, determine if this could be sensitive personal data that might appear in known breaches. Consider:
- Common patterns in leaked data (e.g., "passport", "ID", "medical", "financial")
- File types commonly found in breaches (documents, images of IDs, etc.)
- Recent breach reports and patterns

Respond ONLY with a JSON object in this exact format:
{
  "status": "FOUND" or "NOT_FOUND" or "UNCERTAIN",
  "details": "Brief explanation of why this file might or might not be at risk",
  "confidence": 0-100 (confidence percentage)
}

Be conservative - if uncertain, use "UNCERTAIN" status.`;

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.2,
                    topK: 1,
                    topP: 1,
                    maxOutputTokens: 256,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();
        const text = data.candidates[0]?.content?.parts[0]?.text;

        if (!text) {
            throw new Error('No response from Gemini API');
        }

        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Invalid response format from Gemini API');
        }

        const result = JSON.parse(jsonMatch[0]);

        return {
            status: result.status || 'ERROR',
            details: result.details || 'Unknown',
            confidence: result.confidence || 0
        };
    } catch (error) {
        console.error('Breach scan error:', error);
        return {
            status: 'ERROR',
            details: `Scan failed: ${error.message}`,
            confidence: 0
        };
    }
}

/**
 * Batch scan multiple files
 * @param {Array} files - Array of file objects {name, type, uploadDate}
 * @returns {Promise<Array>} Array of scan results
 */
export async function batchScanFiles(files) {
    const results = [];

    // Process files sequentially to avoid rate limits (60 req/min)
    for (const file of files) {
        const result = await scanForBreach(file.name, file.type, file.uploadDate);
        results.push({
            fileId: file.id,
            fileName: file.name,
            ...result
        });

        // Wait 1 second between requests to stay under rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
}

/**
 * Check if Gemini API is configured
 * @returns {boolean}
 */
export function isGeminiConfigured() {
    return GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here';
}

/**
 * Scan for breaches associated with an email address
 * @param {string} email - Email address to check
 * @returns {Promise<{breachesFound: number, message: string, recommendations: Array}>}
 */
export async function scanForBreaches(email) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
        throw new Error('Gemini API key not configured. Please add your API key to continue.');
    }

    try {
        const prompt = `You are a cybersecurity analyst helping users check if their email has been involved in any known data breaches.

Email to check: ${email}

Based on known data breach patterns and publicly available breach databases (like Have I Been Pwned), analyze if this email might have been exposed in any major data breaches.

Consider:
- Common breach patterns and indicators
- Major known breaches from recent years
- Email domain patterns that might indicate higher risk
- General security recommendations

Respond ONLY with a JSON object in this exact format:
{
  "breachesFound": 0 or positive number,
  "message": "Brief explanation of findings",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

If no specific breaches are found, set breachesFound to 0 and provide general security recommendations.
Be helpful and provide actionable advice.`;

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    topK: 1,
                    topP: 1,
                    maxOutputTokens: 512,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();
        const text = data.candidates[0]?.content?.parts[0]?.text;

        if (!text) {
            throw new Error('No response from Gemini API');
        }

        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Invalid response format from Gemini API');
        }

        const result = JSON.parse(jsonMatch[0]);

        return {
            breachesFound: result.breachesFound || 0,
            message: result.message || 'Scan completed',
            recommendations: result.recommendations || []
        };
    } catch (error) {
        console.error('Breach scan error:', error);
        throw new Error(error.message || 'Failed to scan for breaches');
    }
}
