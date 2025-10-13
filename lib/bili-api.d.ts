// This file provides the correct type definitions for the 'bili-api' library.
declare module 'bili-api' {
  /**
   * @param params An object containing known information (e.g., { bvid: '...' }).
   * @param targets An array of strings specifying the desired information (e.g., ['view']).
   * @param options Optional settings like { wait: 200 }.
   */
  const biliAPI: (
    params: { bvid?: string; aid?: number; mid?: number; uname?: string },
    targets: string[],
    options?: { wait?: number }
  ) => Promise<any>;
  export default biliAPI;
}
