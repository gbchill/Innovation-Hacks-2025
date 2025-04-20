// frontend/src/renderer.js

// Grab references to your form, input, and result container
const form   = document.getElementById('ai-form');
const input  = document.getElementById('prompt');
const output = document.getElementById('result');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const promptText = input.value.trim();
  if (!promptText) return;

  // Show a loading state
  output.textContent = '🤖 Thinking…';

  // Call into your preload.js bridge
  const { text, error } = await window.electronAPI.generateAI(promptText);

  if (error) {
    output.textContent = `❌ Error: ${error}`;
    console.error('AI error:', error);
  } else {
    output.textContent = text;
  }
});
