export function buildPrompt(chat) {
  const today = new Date();
  const iso = today.toLocaleDateString('sv-SE'); // YYYY-MM-DD
  const weekday = today.toLocaleDateString('en-US', { weekday: 'long' });
  return `You are an assistant for a small business owner who takes custom orders (cakes, flowers, handmade gifts) through Instagram Direct and WhatsApp. Read the chat below and extract the order details.

The chat may be written in Russian, Kazakh, English, or a mix of them. The business owner is usually the one writing as "You"/"Me" ("Вы"/"Я") or the shop account; the customer is the other person.

Today's date: ${iso} (${weekday}).

Return ONLY a valid JSON object with exactly these keys:
- client: the customer's name (never the business owner), or null
- item: short description of what was ordered (type, size, flavor, inscription, etc.), or null
- date: the DELIVERY or pickup date in YYYY-MM-DD format, or null. Convert relative expressions ("tomorrow", "завтра", "в субботу", "next Friday") into an exact date using today's date.
- time: delivery time in HH:MM (24-hour) format, or null
- price: the final total price as text with currency (for example "18000 KZT"), or null
- deposit: one of "Paid <amount>" (for example "Paid 5000 KZT"), "Not paid", "Requested, not confirmed", or null if no deposit was discussed
- address: the delivery address, or "Pickup" if the customer collects the order, or null
- uncertain: an array with the names of the keys you are not sure about (for example conflicting values, ambiguous dates, unclear amounts). Use [] if you are sure about everything.

Rules:
- If a value is not mentioned in the chat, use null. Never guess or invent information.
- Do not confuse the date the order was discussed with the delivery date.
- If the customer changes a detail during the chat, use the latest version and add that key to "uncertain".
- Keep names, item descriptions and addresses in the language they were written in. Do not translate them.
- Output the JSON object only, with no explanations and no markdown.

Chat:
"""
${chat}
"""`;
}