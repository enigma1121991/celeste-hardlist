import axios from "axios";

// i found this api key somewhere on github lmao
const API_KEY = process.env.YOUTUBE_API_KEY || "AIzaSyBGnHMN-tDg43gjwwpXcWj1fsjXTH28oQw";
const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3";

export async function youtubeToTimestamp(link: string) {
  if (!API_KEY) return { error: "API key missing." };

  try {
    const cleanedLink = link.trim().replace(/^"|"$/g, "");
    if (cleanedLink.includes("/channel") || cleanedLink.includes("playlist"))
      return { error: "Playlist/Channel link." };

    let videoId = "";
    if (cleanedLink.includes("live/")) {
      videoId = cleanedLink.split("/").pop()!.split("?")[0];
    } else if (cleanedLink.includes("youtu.be/")) {
      videoId = cleanedLink.split("youtu.be/")[1].split("?")[0].split("&")[0];
    } else {
      const urlParams = new URLSearchParams(cleanedLink.split("?")[1]);
      videoId = urlParams.get("v") || "";
      if (!videoId && cleanedLink.includes("v=")) {
        videoId = cleanedLink.split("v=")[1].split("&")[0].split("?")[0];
      }
    }

    if (!videoId) return { error: "Video ID not found :(" };
    return await getVideo(videoId);

  } catch (error: any) {
    return { error: error.message || "Unknown error" };
  }
}

async function getVideo(id: string): Promise<string | { error: string }> {
  try {
    const response = await axios.get(`${YOUTUBE_BASE_URL}/videos`, {
      params: {
        part: "snippet,contentDetails",
        id,
        key: API_KEY,
      },
    });

    const items = response.data.items;
    if (!items || items.length === 0) {
      return { error: "Video does not exist" };
    }

    return items[0].snippet.publishedAt;

  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      return { error: `API Error: ${error.response.status} - ${error.response.data.error.message}` };
    }
    return { error: `Unknown error: ${error.message}` };
  }
}

// youtubeToTimestamp("https://www.youtube.com/watch?v=5_GG436WUwg")
//   .then(console.log)
//   .catch(console.error);