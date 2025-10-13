import axios from 'axios';

export async function getCatboxLastModified(url: string): Promise<string | { error: string }> {
    try {
        const response = await axios.head(url);
        const lastModifiedHeader = response.headers['last-modified'];

        if (lastModifiedHeader) {
            console.log(`Found 'last-modified' header: ${lastModifiedHeader}`);
            return new Date(lastModifiedHeader).toISOString();
        } else {
            return {error: "Response didn't contain the date header. "};
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return {error: `Axios error: ${error.response?.status}`};
        }
        return {error: `${error}`};
    }
}

// console.log(await getCatboxLastModified('https://files.catbox.moe/8x7p6h.png'))