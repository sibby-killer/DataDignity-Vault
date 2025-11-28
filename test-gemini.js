// Test Gemini API
// Run this in browser console to test if API is working

const GEMINI_API_KEY = 'AIzaSyBQWbaZJqtOElhQmiPEVuYzxrFUw79Bsxw';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

async function testGeminiAPI() {
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Say hello in one word'
                    }]
                }]
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Gemini API is WORKING!');
            console.log('Response:', data.candidates[0]?.content?.parts[0]?.text);
            return true;
        } else {
            console.error('❌ Gemini API Error:', response.status, data);
            return false;
        }
    } catch (error) {
        console.error('❌ Network Error:', error);
        return false;
    }
}

// Run the test
testGeminiAPI();
