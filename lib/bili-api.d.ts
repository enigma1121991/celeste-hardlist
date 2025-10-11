declare module 'bili-api' {
    interface BiliAPIParams {
        bvid?: string;
        aid?: number;
    }

    interface BiliAPIVideoData {
        created: number;
        title: string;
        author: string;
        [key: string]: any;
    }

    const biliAPI: (params: BiliAPIParams) => Promise<BiliAPIVideoData>;
    export default biliAPI;
};