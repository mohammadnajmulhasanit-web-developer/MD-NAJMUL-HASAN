export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await req.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY Missing" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const systemPrompt = "You are 'MD. NAJMUL HASAN AI', an all-rounder smart AI assistant embedded in MD. NAJMUL HASAN's website. Answer questions about MD. NAJMUL HASAN's portfolio, web development skills, and background, as well as general world knowledge, science, programming, and general topics. Answer clearly in Bengali or English based on the user language.";

    const formattedHistory = history
      .filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
      .map((item) => ({ role: item.role, content: item.content }));

    const messages = [
      { role: "system", content: systemPrompt },
      ...formattedHistory,
      { role: "user", content: message }
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data?.error?.message || "OpenAI API error" }), {
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    const answer = data.choices[0]?.message?.content || "কোনো উত্তর পাওয়া যায়নি।";

    return new Response(JSON.stringify({ answer }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};    if (!response.ok) {
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
