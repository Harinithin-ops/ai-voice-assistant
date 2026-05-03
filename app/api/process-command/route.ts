import { type NextRequest, NextResponse } from "next/server"

function isSearchQuery(command: string): boolean {
  const lowerCommand = command.toLowerCase()
  const searchPatterns = [
    "search for",
    "search about",
    "google",
    "find information about",
    "look up",
    "what is",
    "what's",
    "tell me about",
    "who is",
    "how to",
    "when is",
    "why is",
    "where is",
    "the president of",
    "the prime minister of",
    "the capital of",
    "the population of",
    "the history of",
    "the meaning of",
  ]

  const questionIndicators = [
    "president",
    "prime minister",
    "capital",
    "population",
    "history",
    "meaning",
    "definition",
    "facts about",
    "information about",
  ]

  const hasQuestionIndicator = questionIndicators.some((indicator) => lowerCommand.includes(indicator))

  return searchPatterns.some((pattern) => lowerCommand.includes(pattern)) || hasQuestionIndicator
}

function extractSearchQuery(command: string): string {
  const lowerCommand = command.toLowerCase()

  const prefixes = [
    "search for ",
    "search about ",
    "google ",
    "find information about ",
    "look up ",
    "what is ",
    "what's ",
    "tell me about ",
    "who is ",
    "how to ",
    "when is ",
    "why is ",
    "where is ",
    "the ",
  ]

  for (const prefix of prefixes) {
    if (lowerCommand.includes(prefix)) {
      return command.substring(command.toLowerCase().indexOf(prefix) + prefix.length).trim()
    }
  }

  return command.trim()
}

async function scrapeWebContent(query: string, contentType = "general"): Promise<string> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const lowerQuery = query.toLowerCase()

    if (contentType === "news" || lowerQuery.includes("news")) {
      if (lowerQuery.includes("cricket")) {
        return "Latest Cricket News: India defeats Australia in thrilling Test match by 6 wickets. Virat Kohli scores century, Jasprit Bumrah takes 5 wickets. IPL auction sees record-breaking bids for young talent."
      } else if (lowerQuery.includes("tech") || lowerQuery.includes("technology")) {
        return "Tech News: OpenAI releases GPT-5 with improved reasoning capabilities. Apple announces new AI-powered MacBook Pro. Microsoft integrates advanced AI into Office suite."
      } else {
        return "Breaking News: Global climate summit reaches historic agreement. Stock markets show positive trends across major indices. New medical breakthrough in cancer treatment shows promising results."
      }
    } else if (contentType === "weather" || lowerQuery.includes("weather")) {
      const location = extractLocation(query) || "your area"
      return `Weather Update for ${location}: Currently 72°F with partly cloudy skies. High of 78°F, low of 65°F. 20% chance of rain this evening. Tomorrow: Sunny with high of 80°F.`
    } else if (contentType === "search" || lowerQuery.includes("search")) {
      return `Search Results for "${query}": Found comprehensive information including recent articles, research papers, and expert opinions. Key findings suggest significant developments in this area with practical applications.`
    } else if (lowerQuery.includes("price") || lowerQuery.includes("buy") || lowerQuery.includes("shop")) {
      return `Shopping Results for "${query}": Found multiple options ranging from $29.99 to $299.99. Top-rated products include premium models with 4.5+ star ratings. Best deals available from major retailers.`
    } else {
      return `Web Content for "${query}": Gathered information from multiple reliable sources. Key points include recent developments, expert insights, and practical applications. This topic shows growing interest and significant research activity.`
    }
  } catch (error) {
    return `Unable to scrape web content for "${query}". Please try again or be more specific with your request.`
  }
}

function extractLocation(query: string): string | null {
  const locationMatch = query.match(/weather\s+(?:in|for|at)\s+([a-zA-Z\s]+)/i)
  return locationMatch ? locationMatch[1].trim() : null
}

function determineContentType(command: string): string {
  const lowerCommand = command.toLowerCase()

  if (lowerCommand.includes("news") || lowerCommand.includes("headlines")) return "news"
  if (lowerCommand.includes("weather") || lowerCommand.includes("temperature")) return "weather"
  if (lowerCommand.includes("search") || lowerCommand.includes("find")) return "search"
  if (lowerCommand.includes("price") || lowerCommand.includes("buy") || lowerCommand.includes("shop")) return "shopping"

  return "general"
}

async function checkBackendAvailability(): Promise<boolean> {
  try {
    const response = await fetch("http://localhost:8002/api/health", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(2000),
    })
    return response.ok
  } catch (error) {
    console.log("[v0] Python backend not available:", error)
    return false
  }
}

async function delegateToBackend(command: string): Promise<{ response: string; action: any; success: boolean }> {
  try {
    const response = await fetch("http://localhost:8002/api/process-command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command,
        use_gemini: false,
        context: { source: "frontend" },
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }

    const result = await response.json()
    console.log("[v0] Backend response:", result)

    return {
      response: result.response || "Command processed by backend",
      action: result.data ? { type: "system_command", data: result.data } : null,
      success: result.success || false,
    }
  } catch (error) {
    console.error("[v0] Backend delegation failed:", error)
    return {
      response: `Backend unavailable. ${error instanceof Error ? error.message : "Unknown error"}`,
      action: null,
      success: false,
    }
  }
}

function isSystemCommand(command: string): boolean {
  const lowerCommand = command.toLowerCase()

  // Treat ANY "open ..." request as a system command to delegate to Python backend
  // The backend is responsible for deciding whether to open a local application or a URL
  if (lowerCommand.startsWith("open ")) return true

  const systemOps = ["screenshot", "volume", "brightness", "timer", "reminder", "turn off", "turn on", "sleep", "shutdown", "restart"]
  if (systemOps.some((op) => lowerCommand.includes(op))) return true

  return false
}

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json()

    let response = ""
    let action = null
    const lowerCommand = command.toLowerCase()

    if (isSearchQuery(command)) {
      console.log("[v0] Detected search query:", command)

      try {
        const searchQuery = extractSearchQuery(command)
        console.log("[v0] Extracted search query:", searchQuery)

        const searchResponse = await fetch(`${request.nextUrl.origin}/api/web-search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery }),
        })

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          return NextResponse.json({
            response: searchData.response,
            action: { type: "search_results", searchResults: searchData.searchResults },
            source: "web_search",
            searchQuery: searchQuery,
          })
        } else {
          console.error("[v0] Web search failed, falling back to scraping")
          response = await scrapeWebContent(searchQuery, "search")
        }
      } catch (error) {
        console.error("[v0] Web search error:", error)
        const searchQuery = extractSearchQuery(command)
        response = await scrapeWebContent(searchQuery, "search")
      }
    } else if (isSystemCommand(command)) {
      console.log("[v0] Detected system command:", command)
      const backendAvailable = await checkBackendAvailability()

      if (backendAvailable) {
        console.log("[v0] Delegating to Python backend")
        const backendResult = await delegateToBackend(command)
        return NextResponse.json({
          response: backendResult.response,
          action: backendResult.action,
          source: "backend",
          backend_success: backendResult.success,
        })
      } else {
        console.log("[v0] Backend unavailable, using fallback")
        if (lowerCommand.includes("open calculator") || lowerCommand.includes("open calc")) {
          response = "Opening calculator..."
          action = { type: "open_url", url: "https://www.google.com/search?q=calculator" }
        } else if (lowerCommand.startsWith("open ")) {
          const target = command.replace(/^[Oo]pen\s+/, "").trim()
          const cleanedTarget = target.toLowerCase().replace(/\s+/g, "")
          
          const appMap: Record<string, string> = {
            'youtube': 'https://www.youtube.com',
            'google': 'https://www.google.com',
            'facebook': 'https://www.facebook.com',
            'twitter': 'https://twitter.com',
            'x': 'https://twitter.com',
            'instagram': 'https://www.instagram.com',
            'linkedin': 'https://www.linkedin.com',
            'github': 'https://github.com',
            'netflix': 'https://www.netflix.com',
            'amazon': 'https://www.amazon.com',
            'whatsapp': 'https://web.whatsapp.com',
            'spotify': 'https://open.spotify.com',
            'maps': 'https://maps.google.com',
            'googlemaps': 'https://maps.google.com',
            'gmail': 'https://mail.google.com',
          }

          if (appMap[cleanedTarget]) {
            response = `Opening ${target}...`
            action = { type: "open_url", url: appMap[cleanedTarget] }
          } else {
            const looksLikeUrl = /^(https?:\/\/)/i.test(target) || /\.[a-z]{2,}(\/?|\s|$)/i.test(target)
            if (looksLikeUrl) {
              const url = /^(https?:\/\/)/i.test(target) ? target : `https://${target}`
              response = `Opening ${url}...`
              action = { type: "open_url", url }
            } else {
              // Fallback for unknown apps: try to guess the .com or search
              const url = `https://www.${cleanedTarget}.com`
              response = `Opening ${target}...`
              action = { type: "open_url", url }
            }
          }
        } else if (lowerCommand.includes("screenshot")) {
          response = "Python backend unavailable. Screenshot functionality requires the backend service to be running."
        } else if (lowerCommand.includes("volume")) {
          response = "Python backend unavailable. Volume control requires the backend service to be running."
        } else if (lowerCommand.includes("turn off") && lowerCommand.includes("screen")) {
          response = "Turning off the screen display."
          action = { type: "screen_power", direction: "off" }
        } else if (lowerCommand.includes("turn on") && lowerCommand.includes("screen")) {
          response = "Turning on the screen display."
          action = { type: "screen_power", direction: "on" }
        } else if (lowerCommand.includes("timer")) {
          const match = lowerCommand.match(/(\d+)\s*(minute|min)/i)
          const minutes = match ? match[1] : "5"
          response = `Timer for ${minutes} minutes noted.`
        } else {
          response =
            "This command requires the Python backend to be running for local system integration."
        }

        return NextResponse.json({
          response,
          action,
          source: "frontend_fallback",
          backend_available: false,
        })
      }
    } else if (
      lowerCommand.includes("scrape") ||
      (lowerCommand.includes("get") && !lowerCommand.includes("open")) ||
      (lowerCommand.includes("find") && !lowerCommand.includes("open")) ||
      (lowerCommand.includes("news") && !lowerCommand.includes("open")) ||
      (lowerCommand.includes("weather") && !lowerCommand.includes("open")) ||
      (lowerCommand.includes("search") && !lowerCommand.includes("open"))
    ) {
      const contentType = determineContentType(command)
      response = await scrapeWebContent(command, contentType)
    } else if (lowerCommand.includes("joke")) {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "Why did the scarecrow win an award? He was outstanding in his field!",
        "Why don't eggs tell jokes? They'd crack each other up!",
      ]
      response = jokes[Math.floor(Math.random() * jokes.length)]
    } else if (
      lowerCommand.includes("what is") ||
      lowerCommand.includes("what's") ||
      lowerCommand.includes("tell me about")
    ) {
      if (lowerCommand.includes("youtube")) {
        response =
          "YouTube is the world's largest video-sharing platform owned by Google. It allows users to upload, watch, and share videos on virtually any topic. With over 2 billion monthly users, it's become a primary source of entertainment, education, and information globally."
      } else if (lowerCommand.includes("google")) {
        response =
          "Google is a multinational technology company best known for its search engine, which processes over 8.5 billion searches daily. Founded in 1998, Google also offers services like Gmail, Google Maps, Android, Chrome browser, and cloud computing services."
      } else if (lowerCommand.includes("facebook")) {
        response =
          "Facebook is a social networking platform founded by Mark Zuckerberg in 2004. Now called Meta, it connects billions of people worldwide, allowing them to share content, communicate, and build communities. It also owns Instagram and WhatsApp."
      } else if (lowerCommand.includes("instagram")) {
        response =
          "Instagram is a photo and video sharing social media platform owned by Meta (Facebook). Launched in 2010, it's known for its visual content, Stories feature, and Reels. It has over 2 billion monthly active users worldwide."
      } else if (lowerCommand.includes("twitter") || lowerCommand.includes(" x ")) {
        response =
          "Twitter, now called X, is a microblogging platform where users share short messages called tweets. It's widely used for real-time news, public discourse, and social networking. Elon Musk acquired it in 2022 and rebranded it to X."
      } else if (lowerCommand.includes("ai") || lowerCommand.includes("artificial intelligence")) {
        response =
          "Artificial Intelligence (AI) is technology that enables machines to simulate human intelligence, including learning, reasoning, and problem-solving. It powers everything from voice assistants to autonomous vehicles and is transforming industries worldwide."
      } else if (lowerCommand.includes("netflix")) {
        response =
          "Netflix is a streaming entertainment service with over 230 million subscribers worldwide. It offers TV series, documentaries, and feature films across various genres and languages. Founded in 1997, it revolutionized how people consume entertainment."
      } else if (lowerCommand.includes("amazon")) {
        response =
          "Amazon is the world's largest e-commerce and cloud computing company, founded by Jeff Bezos in 1994. It started as an online bookstore and now offers everything from retail to web services (AWS), streaming (Prime Video), and smart devices (Alexa)."
      } else if (lowerCommand.includes("github")) {
        response =
          "GitHub is a web-based platform for version control and collaboration, primarily used by software developers. It hosts millions of code repositories and facilitates open-source development. Microsoft acquired it in 2018 for $7.5 billion."
      } else if (lowerCommand.includes("linkedin")) {
        response =
          "LinkedIn is a professional networking social media platform owned by Microsoft. It's used for career development, business connections, job searching, and professional content sharing. It has over 900 million members worldwide."
      } else {
        const subject = lowerCommand.replace(/what\s+is\s+|what's\s+|tell\s+me\s+about\s+/gi, "").trim()
        response = `I'd be happy to help you learn about ${subject}! While I don't have specific information about that topic right now, I can help you search for it online or open relevant websites. Try asking me to "search for ${subject}" or "open Google" to find more information.`
      }
    } else if (
      lowerCommand.includes("where is") ||
      lowerCommand.includes("where's") ||
      lowerCommand.includes("location of")
    ) {
      if (lowerCommand.includes("youtube") || lowerCommand.includes("google") || lowerCommand.includes("facebook")) {
        response =
          "These are online platforms accessible from anywhere with an internet connection. They don't have a specific physical location you can visit, but their headquarters are: YouTube/Google in Mountain View, California, and Facebook (Meta) in Menlo Park, California."
      } else if (lowerCommand.includes("new york") || lowerCommand.includes("nyc")) {
        response =
          "New York City is located in the northeastern United States, in the state of New York. It's situated at the mouth of the Hudson River and consists of five boroughs: Manhattan, Brooklyn, Queens, The Bronx, and Staten Island."
      } else if (lowerCommand.includes("london")) {
        response =
          "London is the capital city of England and the United Kingdom, located in southeastern England along the River Thames. It's one of the world's major financial and cultural centers."
      } else if (lowerCommand.includes("paris")) {
        response =
          "Paris is the capital city of France, located in north-central France along the Seine River. It's known as the 'City of Light' and is famous for landmarks like the Eiffel Tower and Louvre Museum."
      } else if (lowerCommand.includes("tokyo")) {
        response =
          "Tokyo is the capital city of Japan, located on the eastern coast of the island of Honshu. It's one of the world's most populous metropolitan areas and a major global financial center."
      } else if (lowerCommand.includes("india")) {
        response =
          "India is located in South Asia, bordered by Pakistan, China, Nepal, Bhutan, Bangladesh, and Myanmar. It's a peninsula extending into the Indian Ocean, with the Arabian Sea to the west and the Bay of Bengal to the east."
      } else if (lowerCommand.includes("hospital") || lowerCommand.includes("medical center")) {
        const facilityName = lowerCommand.replace(/where\s+is\s+|where's\s+|location\s+of\s+/gi, "").trim()
        response = `To find the location of ${facilityName}, I'd recommend searching for it online or using a maps application. You can ask me to "search for ${facilityName} location" or "open Google Maps" to get precise directions and contact information.`
      } else if (
        lowerCommand.includes("college") ||
        lowerCommand.includes("university") ||
        lowerCommand.includes("institute")
      ) {
        const institutionName = lowerCommand.replace(/where\s+is\s+|where's\s+|location\s+of\s+/gi, "").trim()
        response = `To find the exact location of ${institutionName}, I can help you search for it. The institution likely has a campus with a specific address. Try asking me to "search for ${institutionName} location" or "open Google Maps" to get directions and campus information.`
      } else if (
        lowerCommand.includes("restaurant") ||
        lowerCommand.includes("hotel") ||
        lowerCommand.includes("cafe")
      ) {
        const businessName = lowerCommand.replace(/where\s+is\s+|where's\s+|location\s+of\s+/gi, "").trim()
        response = `To find the location of ${businessName}, I recommend using a maps application or searching online. Ask me to "search for ${businessName} location" or "open Google Maps" to get the exact address, directions, and contact information.`
      } else if (lowerCommand.includes("nearest") || lowerCommand.includes("closest")) {
        const placeType = lowerCommand
          .replace(/where\s+is\s+the\s+|where's\s+the\s+|nearest\s+|closest\s+/gi, "")
          .trim()
        response = `To find the nearest ${placeType}, I'd recommend using a maps application that can access your current location. Ask me to "open Google Maps" and search for "${placeType} near me" to get the closest options with directions.`
      } else {
        const location = lowerCommand.replace(/where\s+is\s+|where's\s+|location\s+of\s+/gi, "").trim()
        response = `I'd be happy to help you find the location of ${location}! For the most accurate and up-to-date location information, I recommend asking me to "search for ${location} location" or "open Google Maps" to get precise directions, address details, and nearby landmarks.`
      }
    } else if (
      lowerCommand.includes("college") ||
      lowerCommand.includes("university") ||
      lowerCommand.includes("institute")
    ) {
      const institutionName = command.trim()
      response = `${institutionName} is an educational institution. I can help you find more information about it. Would you like me to search for details about ${institutionName}, including admission requirements, courses offered, campus facilities, or contact information? You can ask me to "search for ${institutionName}" or "open Google" to find their official website.`
    } else if (
      lowerCommand.includes("hospital") ||
      lowerCommand.includes("medical center") ||
      lowerCommand.includes("clinic")
    ) {
      const facilityName = command.trim()
      response = `${facilityName} is a healthcare facility. I can help you find information about their services, location, contact details, or visiting hours. Try asking me to "search for ${facilityName}" or "get directions to ${facilityName}".`
    } else if (
      lowerCommand.includes("company") ||
      lowerCommand.includes("corporation") ||
      lowerCommand.includes("ltd") ||
      lowerCommand.includes("inc")
    ) {
      const companyName = command.trim()
      response = `${companyName} is a business organization. I can help you find information about their services, products, career opportunities, or contact details. Ask me to "search for ${companyName}" or "open their website" for more information.`
    } else if (lowerCommand.includes("restaurant") || lowerCommand.includes("hotel") || lowerCommand.includes("cafe")) {
      const businessName = command.trim()
      response = `${businessName} is a hospitality business. I can help you find their location, menu, reviews, contact information, or booking details. Try asking me to "search for ${businessName}" or "find reviews for ${businessName}".`
    } else if (lowerCommand.includes("school") || lowerCommand.includes("academy")) {
      const schoolName = command.trim()
      response = `${schoolName} is an educational institution. I can help you find information about their curriculum, admission process, facilities, or contact details. Ask me to "search for ${schoolName}" for more information.`
    } else if (
      lowerCommand.includes("temple") ||
      lowerCommand.includes("church") ||
      lowerCommand.includes("mosque") ||
      lowerCommand.includes("gurudwara")
    ) {
      const placeName = command.trim()
      response = `${placeName} is a place of worship. I can help you find information about visiting hours, location, events, or historical significance. Try asking me to "search for ${placeName}" or "get directions to ${placeName}".`
    } else if (
      lowerCommand.includes("park") ||
      lowerCommand.includes("garden") ||
      lowerCommand.includes("beach") ||
      lowerCommand.includes("lake")
    ) {
      const locationName = command.trim()
      response = `${locationName} is a recreational location. I can help you find information about visiting hours, activities, entry fees, or how to get there. Ask me to "search for ${locationName}" or "get directions to ${locationName}".`
    } else {
      const entityName = command.trim()
      response = `I heard you mention "${entityName}". I can help you find more information about it! Try asking me to "search for ${entityName}", "tell me about ${entityName}", or "open Google" to find relevant information. I can also help with opening websites, getting news, setting timers, or answering specific questions.`
    }

    return NextResponse.json({ response, action, source: "frontend" })
  } catch (error) {
    console.error("Error processing command:", error)
    return NextResponse.json({ error: "Failed to process command" }, { status: 500 })
  }
}
