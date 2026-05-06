// const JS_FILE = "https://www.kaikatsu.jp/common/js/shop_vacancy.js";

// export async function getEndpoint(): Promise<{
//   endpoint: string;
//   api_key: string;
// }> {
//   const body = await got(JS_FILE).text();

//   const endpointMatch = body.match(/prod_ajax_url\s*=\s*["']([^"']+)["']/);
//   const apiKeyMatch = body.match(/prod_api_key\s*=\s*["']([^"']+)["']/);

//   if (!endpointMatch || !apiKeyMatch) {
//     throw new Error("Failed to extract endpoint or api_key from JS file");
//   }

//   return {
//     endpoint: endpointMatch[1]!,
//     api_key: apiKeyMatch[1]!,
//   };
// }

// export const { endpoint, api_key } = await getEndpoint();

export const { endpoint, api_key } = {
  endpoint:
    "https://jx5rl6ilkg.execute-api.ap-northeast-1.amazonaws.com/prd/empty_seat?store_cd=",
  api_key: "VBVkOEaMZR5WKLi7mpKiAaFS5INR2rAR6Bgw7aOs",
};
