// server.js
const fastify = require('fastify')({ logger: true });
const LiveKit = require('@livekit/server-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Deepgram = require('deepgram-sdk');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const deepgram = Deepgram.create(process.env.DEEPGRAM_KEY);

fastify.register(require('@fastify/websocket'));

// WebRTC Room Management
fastify.post('/create-room', async (req, reply) => {
  const room = new LiveKit.RoomServiceClient(
    process.env.LIVEKIT_URL,
    process.env.LIVEKIT_API_KEY
  );
  
  const roomName = `interview-${Date.now()}`;
  await room.createRoom({ name: roomName });
  return { roomName, token: generateToken(roomName) };
});

// AI Agent Handler
fastify.register(async function (fastify) {
  fastify.post('/ai-analyze', async (req, reply) => {
    const { videoFrame, audioBuffer, postureData } = req.body;
    
    // Vision Analysis
    const visionPrompt = `Analyze this frame: ${JSON.stringify(postureData)}. Is candidate sitting straight? Eye contact? Smile?`;
    
    // Audio Analysis  
    const transcription = await deepgram.transcription.live(audioBuffer);
    
    // LLM Brain
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const prompt = `
    You are HR interviewer for blue-collar jobs.
    Candidate said: "${transcription}"
    Posture: ${postureData.eyeContact}% eye contact, ${postureData.posture}% posture
    
    Ask next relevant question OR give feedback.
    Keep responses 10-15 seconds long.
    `;
    
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();
    
    // Text-to-Speech
    const audio = await elevenLabs.textToSpeech(aiResponse, 'hindi_voice');
    
    return { response: aiResponse, audio };
  });
});

fastify.listen({ port: 3000 });
