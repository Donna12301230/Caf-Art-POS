import Parse from "parse";

const appId = import.meta.env.VITE_PARSE_APP_ID as string;
const jsKey = import.meta.env.VITE_PARSE_JS_KEY as string;

if (!appId || !jsKey) {
  console.warn("Parse credentials not set. Set VITE_PARSE_APP_ID and VITE_PARSE_JS_KEY in .env");
}

Parse.initialize(appId, jsKey);
Parse.serverURL = "https://parseapi.back4app.com";

export default Parse;
