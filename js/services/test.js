export async function getEvents() {
  const response = await fetch("./data/events/test.json");

  if (!response.ok) {
    throw new Error("Failed to load events");
  }

  return response.json();
}