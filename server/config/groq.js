import { Groq } from 'groq-sdk';

let groq = null;

if (process.env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} else {
  console.warn('Warning: GROQ_API_KEY is not set. Groq functionality will be disabled.');
}

export default groq;
