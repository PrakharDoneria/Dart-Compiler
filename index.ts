import { serve } from "https://deno.land/std@0.202.0/http/server.ts";
import { kv } from "./kv.ts";
import { cleanUpExpiredEntries } from "./cleanup.ts";

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  if (req.method === "POST" && pathname === "/dart") {
    try {
      const { code } = await req.json();

      if (!code) {
        return new Response(JSON.stringify({ error: "Missing 'code' parameter" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const requestBody = JSON.stringify({ source: code });

      const apiResponse = await fetch("https://master.api.dartpad.dev/api/v3/compileDDC", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      });

      if (!apiResponse.ok) {
        return new Response(JSON.stringify({ error: "Failed to compile Dart code" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      const apiResult = await apiResponse.json();

      return new Response(JSON.stringify({ result: apiResult.result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "An error occurred: " + error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } else if (req.method === "POST" && pathname === "/save") {
    try {
      const { uid, code } = await req.json();

      if (!uid || !code) {
        return new Response(JSON.stringify({ error: "Missing 'uid' or 'code' parameter" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const timestamp = Date.now();
      await kv.set(["codes", uid], { code, timestamp });

      return new Response(JSON.stringify({ message: "Code saved successfully" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "An error occurred: " + error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } else if (req.method === "GET" && pathname === "/load") {
    try {
      const uid = url.searchParams.get("uid");

      if (!uid) {
        return new Response("Missing 'uid' query parameter", { status: 400 });
      }

      const entryKey = ["codes", uid];
      const entry = await kv.get(entryKey);

      if (!entry.value) {
        return new Response("Code not found", { status: 404 });
      }

      const { code, timestamp } = entry.value;
      await cleanUpExpiredEntries(entryKey, timestamp);

      const updatedEntry = await kv.get(entryKey);

      if (!updatedEntry.value) {
        return new Response("Code has expired and has been deleted", { status: 410 });
      }

      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Loaded Code</title>
        </head>
        <body>
          <h1>Loaded Code</h1>
          <pre>${code}</pre>
          <script>
            console.log("Loaded code:", ${JSON.stringify(code)});
          </script>
        </body>
        </html>
      `, {
        headers: { "Content-Type": "text/html" },
      });
    } catch (error) {
      return new Response("An error occurred: " + error.message, { status: 500 });
    }
  } else {
    return new Response("Not Found", { status: 404 });
  }
}

Deno.cron("30 6 * * *", async () => {
  console.log("Running scheduled cleanup job...");
  await cleanUpExpiredEntries();
});


console.log("Server running on http://localhost:8000");
serve(handler);
