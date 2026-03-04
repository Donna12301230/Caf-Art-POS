/**
 * 建立 DEMO 帳號
 * 執行方式：npx tsx scripts/create-demo-user.ts
 */
import Parse from "parse/node";

Parse.initialize("0Kmtf0EkoZczfBc2PILKJC8Ytyqb6hEWh79oBZs6", "xtid6lNNaLkE0XpBkiED53UzK5WSjwT1qHWTidKq");
Parse.serverURL = "https://parseapi.back4app.com";

async function main() {
  const user = new Parse.User();
  user.set("username", "demo");
  user.set("password", "demo1234");
  user.set("email", "demo@cafeart.pos");
  user.set("role", "Manager");
  user.set("firstName", "Demo");
  user.set("lastName", "User");

  try {
    await user.signUp();
    console.log("✅ Demo 帳號建立成功！");
    console.log("   帳號：demo");
    console.log("   密碼：demo1234");
  } catch (err: any) {
    if (err.code === 202) {
      console.log("ℹ️  Demo 帳號已存在，無需重複建立。");
    } else {
      console.error("❌ 建立失敗：", err.message);
    }
  }
}

main();
