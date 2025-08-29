import { type NextRequest, NextResponse } from "next/server"
export const runtime = 'nodejs'

// Use the previously provided constants
const GOOGLE_API_KEY = "AIzaSyB2iZso1Z8qhKY-oDPSMXxrcWUT26SoKyo"
const SEARCH_ENGINE_ID = "64d7c086abfef411d"
const GEMINI_API_KEY = "AIzaSyB2iZso1Z8qhKY-oDPSMXxrcWUT26SoKyo"

interface SearchResult {
  title: string
  snippet: string
  link: string
}

async function fallbackSearch(query: string): Promise<{ response: string; searchResults?: SearchResult[] }> {
  try {
    console.log("[v0] Using Gemini knowledge base as fallback")
    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Please provide a helpful and informative answer to this query: "${query}". Use your knowledge base to give accurate, up-to-date information. If you don't have current information, mention that and provide what general knowledge you can. Keep the response conversational and helpful.`,
                },
              ],
            },
          ],
        }),
      },
    )

    if (geminiResponse.ok) {
      const geminiData = await geminiResponse.json()
      const response = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

      if (response) {
        console.log("[v0] Gemini fallback successful")
        return {
          response: response,
          searchResults: [
            {
              title: "AI Knowledge Base Response",
              snippet: response.substring(0, 150) + "...",
              link: "#",
            },
          ],
        }
      }
    }
  } catch (error) {
    console.log("[v0] Gemini fallback also failed:", error)
  }

  return {
    response: `I'm currently unable to search the web, but I can still help you with:

• Opening applications (say "open calculator", "open notepad")
• System commands and controls
• General questions from my knowledge base

To enable full web search capabilities, please enable the Google Custom Search API in your Google Cloud Console.`,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()
    console.log("[v0] Web search query received:", query)

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
      console.warn("[v0] Google CSE not configured. Falling back to Gemini or guidance.")
      const fallbackResult = await fallbackSearch(query)
      return NextResponse.json(fallbackResult)
    }

    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=5`
    console.log("[v0] Making Google Custom Search request")

    const searchResponse = await fetch(searchUrl)
    console.log("[v0] Google Search response status:", searchResponse.status)

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.error("[v0] Google Search API error:", errorText)

      // Check if it's an API permission/configuration error
      if (searchResponse.status === 403 || errorText.includes("Custom Search API has not been used")) {
        console.log("[v0] API not enabled, using fallback search")
        const fallbackResult = await fallbackSearch(query)
        return NextResponse.json(fallbackResult)
      }

      throw new Error(`Google Search API failed: ${searchResponse.status} - ${errorText}`)
    }

    const searchData = await searchResponse.json()
    console.log("[v0] Search data received, items count:", searchData.items?.length || 0)

    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json({ response: "No results found." })
    }

    const searchResults: SearchResult[] = searchData.items.slice(0, 5).map((item: any) => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link,
    }))

    const searchContent = searchResults
      .map((result, index) => `${index + 1}. ${result.title}\n${result.snippet}\nSource: ${result.link}`)
      .join("\n\n")

    if (!GEMINI_API_KEY) {
      console.warn("[v0] GEMINI_API_KEY not set. Returning basic summary without LLM.")
      const basicSummary = `Found ${searchResults.length} results for "${query}". ${searchResults[0].snippet}`
      return NextResponse.json({
        response: basicSummary,
        searchResults: searchResults,
        success: true,
      })
    }

    console.log("[v0] Making Gemini API request for summary")
    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Please provide a clear and concise summary of these search results for the query "${query}":\n\n${searchContent}\n\nSummarize the key information in a user-friendly way, highlighting the most relevant points.`,
                },
              ],
            },
          ],
        }),
      },
    )

    console.log("[v0] Gemini response status:", geminiResponse.status)

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error("[v0] Gemini API error:", errorText)
      const basicSummary = `Found ${searchResults.length} results for "${query}". ${searchResults[0].snippet}`
      return NextResponse.json({
        response: basicSummary,
        searchResults: searchResults,
        success: true,
      })
    }

    const geminiData = await geminiResponse.json()
    const summary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate summary."

    console.log("[v0] Web search completed successfully")
    return NextResponse.json({
      response: summary,
      searchResults: searchResults,
      success: true,
    })
  } catch (error) {
    console.error("[v0] Web search error:", error)
    const fallbackResult = await fallbackSearch(await request.json().then((data) => data.query))
    return NextResponse.json(fallbackResult)
  }
}
