import biliAPI from 'bili-api';

interface BiliVideoData {
  pubdate: number;
}

async function fetchVideoData(id: string): Promise<BiliVideoData> {
    const params: { bvid?: string; aid?: number } = {};

    if (id.toLowerCase().startsWith("bv")) {
        params.bvid = id;
    } else if (id.toLowerCase().startsWith("av")) {
        params.aid = parseInt(id.substring(2), 10);
    } else {
        throw new Error(`Invalid ID format: ${id}`);
    }

    const response = await biliAPI(params, ['view']);

    if (!response?.view?.data?.pubdate) {
        throw new Error(`bili-api fucking sucks and returned something fucked up at ${id}. Response: ${JSON.stringify(response)}`);
    }

    return response.view.data;
}

export async function getBilibiliTimestamp(link: string): Promise<string | { error: string }> {
    try {
        const cleanedLink = link.trim().replace(/['"]+/g, "");
        if (cleanedLink.includes("space")) {
            return { error: "Link isn't a video!" };
        }

        let id: string | null = null;
        try {
            id = getIdFromLink(cleanedLink);
        } catch {
            try {
                const longId = await getVideoIdFromShorthand(cleanedLink);
                if (!longId) {
                    return { error: "Failed to resolve short URL to a valid video ID." };
                }
                id = longId;
            } catch (err: any) {
                return { error: `Invalid link: ${err.message || err}` };
            }
        }
        
        if (!id) {
            return { error: "Invalid AV or BV ID from the link" };
        }

        const videoData = await fetchVideoData(id);
        return new Date(videoData.pubdate * 1000).toISOString();

    } catch (error: any) {
        return { error: error.message || "who fucking knows anymore" };
    }
}

function getIdFromLink(link: string): string {
    if (link.includes("/av")) {
        const match = link.match(/av([0-9]+)/);
        if (match) return `av${match[1]}`;
    }
    const match = link.match(/[bB][vV]([0-9a-zA-Z]{10})/);
    if (match) return match[0];
    
    throw new Error("No valid AV or BV ID in the link");
}

async function getVideoIdFromShorthand(shortUrl: string): Promise<string | null> {
    try {
        const response = await fetch(shortUrl, { method: "HEAD", redirect: "follow" });
        const finalUrl = response.url;
        const videoIdMatch = finalUrl.match(/\/video\/(BV\w+)/);
        return videoIdMatch ? videoIdMatch[1] : null;
    } catch {
        return null;
    }
}

