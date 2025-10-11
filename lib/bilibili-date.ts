import biliAPI from 'bili-api';

export async function getBilibiliTimestamp(link: string): Promise<string | null> {
    try {
        const cleanedLink = link.trim().replace(/['"]+/g, "");
        if (cleanedLink.includes("space")) {
            return null;
        }

        let id: string | null = null;
        let longId: string | null = null;

        try {
            id = getIdFromLink(cleanedLink);
        } catch {
            try {
                longId = await getVideoIdFromShorthand(cleanedLink);
                if (id === null) throw new Error("failed to get id from shorturl")
                longId = id
                id = getShorthandId(cleanedLink)
            } catch (errr) {
                console.log('invalid link')
                return null;
            }
        }
        
        if (!id) return null;
        const idToProcess = longId ?? id;
        const videoData = await getVideoData(idToProcess);

        if (!videoData || !videoData.created) {
            return null;
        }
        return (new Date(videoData.created * 1000)).toISOString();

    } catch (error) {return null;}
}

function getIdFromLink(link: string): string {
    if (link.includes("/av")) {
        const match = link.match(/(av[0-9]+)/);
        if (match) return match[1];
    }
    const match = link.match(/([bB][vV][0-9a-zA-Z]{10})/);
    if (match) return match[1];
    
    throw new Error("No valid AV or BV ID found in link.");
}

async function getVideoData(id: string): Promise<any> {
    const params: { bvid?: string; aid?: number } = {};

    if (id.toLowerCase().startsWith("bv")) {
        params.bvid = id;
    } else if (id.toLowerCase().startsWith("av")) {
        params.aid = parseInt(id.substring(2));
    } else {
        throw new Error(`Invalid ID format provided to getVideoData: ${id}`);
    }

    const videoData = await biliAPI(params);
    
    if (videoData && videoData.created) return videoData;

    throw new Error(`bili-api returned an unexpected data structure for ID ${id}`);
}

async function getVideoIdFromShorthand(shortUrl: string): Promise<string | null> {
    try {
        const response = await fetch(shortUrl, {
            method: "HEAD",
            redirect: "follow",
        });
        const finalUrl = response.url;
        const videoIdMatch = finalUrl.match(/\/video\/(BV\w+)/);
        return videoIdMatch ? videoIdMatch[1] : null;
    } catch {return null;}
}

function getShorthandId(url: string): string | null {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const shorthandIdMatch = pathname.match(/^\/([^\/]+)/);
        return shorthandIdMatch ? shorthandIdMatch[1] : null;
    } catch {
        return null;
    }
}

console.log(await getBilibiliTimestamp("https://www.bilibili.com/video/BV1d84y1n7Pp"))
console.log(await getBilibiliTimestamp("https://b23.tv/BV1d84y1n7Pp"))