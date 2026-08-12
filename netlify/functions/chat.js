export default async (req) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const body = await req.json();

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const history =
      Array.isArray(body.history)
        ? body.history
            .filter(
              (item) =>
                item &&
                (item.role === "user" || item.role === "assistant") &&
                typeof item.content === "string"
            )
            .slice(-12)
        : [];

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    if (message.length > 4000) {
      return new Response(
        JSON.stringify({ error: "Message is too long." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "OPENAI_API_KEY is not configured on Netlify."
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const input = [
      {
        role: "developer",
        content:
          "You are MD. NAJMUL HASAN's professional website AI assistant. " +
          "Answer questions about his public professional profile, skills, " +
          "projects, web development, API integration, automation, AI work, " +
          "services and ways to contact him. " +
          "Be accurate, professional, concise and helpful. " +
          "Never invent private information or credentials. " +
          "If information is not available on the website, clearly say so."
      },
      ...history,
      {
        role: "user",
        content: message
      }
    ];

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-5-mini",
          input,
          store: false
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);

      return new Response(
        JSON.stringify({
          error:
            data?.error?.message ||
            "OpenAI API request failed."
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    let answer = "";

    if (Array.isArray(data.output)) {
      for (const item of data.output) {
        if (item.type !== "message" || !Array.isArray(item.content)) {
          continue;
        }

        for (const content of item.content) {
          if (
            content.type === "output_text" &&
            typeof content.text === "string"
          ) {
            answer += content.text;
          }
        }
      }
    }

    if (!answer.trim()) {
      answer = "Sorry, I couldn't generate a response right now.";
    }

    return new Response(
      JSON.stringify({
        answer: answer.trim()
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    console.error("Function error:", error);

    return new Response(
      JSON.stringify({
        error: "Something went wrong. Please try again."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
