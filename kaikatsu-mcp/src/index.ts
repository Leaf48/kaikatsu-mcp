import { api_key, endpoint } from "./kaikatsu/get-endpoint.js";
import { Kaikatsu } from "./kaikatsu/index.js";

const main = async () => {
  //
  console.log(endpoint, api_key);
  const kaikatsu = new Kaikatsu();
  const res = await kaikatsu.checkVacancy("");
  // const res = await kaikatsu.lookupStore(["北海道", "条西"]);
  console.log(res);
};

main().catch(console.log);
