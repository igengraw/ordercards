import { loadSettings } from './settings';
import { buildPrompt } from './ai/prompt';
import { callModel, parseJSON } from './ai/providers';

// Reads the chat with whichever AI the user chose in Settings.
export async function extractOrder(chat) {
  const settings = await loadSettings();
  const text = await callModel(settings, buildPrompt(chat));
  return parseJSON(text);
}