/**
 * 測試資料種子腳本
 * 執行方式：npx tsx scripts/seed.ts
 *
 * 會建立以下資料：
 *  - Category     ×4
 *  - Artist       ×4 (3 approved, 1 pending)
 *  - Product      ×16
 *  - Customer     ×8
 *  - Order        ×18
 *  - InventoryItem ×12
 *  - Supplier     ×3
 *  - ArtworkSubmission ×3
 */

import Parse from "parse/node";

// ── 初始化 ────────────────────────────────────────────────
const APP_ID = "0Kmtf0EkoZczfBc2PILKJC8Ytyqb6hEWh79oBZs6";
const JS_KEY = "xtid6lNNaLkE0XpBkiED53UzK5WSjwT1qHWTidKq";
Parse.initialize(APP_ID, JS_KEY);
Parse.serverURL = "https://parseapi.back4app.com";

// ── 工具函式 ──────────────────────────────────────────────
const ptr = (className: string, id: string) => {
  const obj = new Parse.Object(className);
  obj.id = id;
  return obj;
};

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const hoursAgo = (h: number) => {
  const d = new Date();
  d.setHours(d.getHours() - h);
  return d;
};

// ── 1. Category ───────────────────────────────────────────
async function seedCategories() {
  console.log("📂 建立 Categories...");
  const data = [
    { name: "飲品",     type: "beverage",    description: "各式咖啡、茶飲與特調飲品" },
    { name: "食物",     type: "food",        description: "輕食、甜點與麵包" },
    { name: "藝術品",   type: "artwork",     description: "藝術家原創繪畫與版畫" },
    { name: "周邊商品", type: "merchandise", description: "咖啡廳限定馬克杯、提袋等周邊" },
  ];

  const saved: Record<string, string> = {};
  for (const d of data) {
    const obj = new Parse.Object("Category");
    obj.set(d);
    await obj.save();
    saved[d.type] = obj.id;
    console.log(`  ✓ ${d.name} (${obj.id})`);
  }
  return saved;
}

// ── 2. Artist ─────────────────────────────────────────────
async function seedArtists() {
  console.log("🎨 建立 Artists...");
  const data = [
    {
      name: "Maya Chen",
      style: "水彩插畫",
      status: "approved",
      email: "maya@example.com",
      bio: "台灣出生的插畫家，擅長以水彩描繪城市日常與自然光影，作品充滿溫暖色調。",
      totalSales: 24800,
      commissionRate: 30,
    },
    {
      name: "Luna Kim",
      style: "數位藝術",
      status: "approved",
      email: "luna@example.com",
      bio: "韓裔數位藝術家，融合傳統東方美學與現代設計，作品常見於各大藝文展覽。",
      totalSales: 18500,
      commissionRate: 28,
    },
    {
      name: "Alex Wu",
      style: "攝影藝術",
      status: "approved",
      email: "alex@example.com",
      bio: "旅行攝影師，用鏡頭記錄世界各地的咖啡文化，黑白與彩色並重。",
      totalSales: 9200,
      commissionRate: 25,
    },
    {
      name: "River Lee",
      style: "油畫",
      status: "pending",
      email: "river@example.com",
      bio: "新銳油畫家，師承古典寫實，目前正在申請加入咖啡廳藝術家計劃。",
      totalSales: 0,
      commissionRate: 30,
    },
  ];

  const saved: string[] = [];
  for (const d of data) {
    const obj = new Parse.Object("Artist");
    obj.set(d);
    await obj.save();
    saved.push(obj.id);
    console.log(`  ✓ ${d.name} [${d.status}] (${obj.id})`);
  }
  return saved; // [mayaId, lunaId, alexId, riverId]
}

// ── 3. Product ────────────────────────────────────────────
async function seedProducts(
  cats: Record<string, string>,
  artistIds: string[]
) {
  console.log("☕ 建立 Products...");
  const [mayaId, lunaId, alexId] = artistIds;

  const beverageImages = [
    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1533422902779-aff35862e462?w=400&h=300&fit=crop",
  ];

  const foodImages = [
    "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop",
  ];

  const artImages = [
    "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&h=300&fit=crop",
  ];

  const merchImages = [
    "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1612528443702-f6741f70a049?w=400&h=300&fit=crop",
  ];

  const products = [
    // 飲品
    { name: "手沖拿鐵",    categoryType: "beverage", price: "150", description: "精選衣索比亞單品豆，搭配絲滑奶泡", isActive: true, stockQuantity: 99, imageUrl: beverageImages[0] },
    { name: "卡布奇諾",    categoryType: "beverage", price: "140", description: "濃縮咖啡與綿密奶泡的完美比例", isActive: true, stockQuantity: 99, imageUrl: beverageImages[1] },
    { name: "抹茶拿鐵",    categoryType: "beverage", price: "160", description: "日本宇治抹茶粉，帶出茶香的細膩層次", isActive: true, stockQuantity: 50, imageUrl: beverageImages[2] },
    { name: "冷萃黑咖啡",  categoryType: "beverage", price: "130", description: "冷泡12小時，低酸度順滑口感", isActive: true, stockQuantity: 30, imageUrl: beverageImages[3] },
    { name: "柳橙氣泡飲",  categoryType: "beverage", price: "120", description: "新鮮現榨柳橙汁加氣泡水，清爽解渴", isActive: true, stockQuantity: 20, imageUrl: beverageImages[4] },
    { name: "玫瑰荔枝茶",  categoryType: "beverage", price: "145", description: "玫瑰花茶搭配荔枝糖漿，浪漫果香", isActive: true, stockQuantity: 4, imageUrl: beverageImages[5] },

    // 食物
    { name: "奶油可頌",          categoryType: "food", price: "80",  description: "每日現烤，外酥內軟，奶香濃郁", isActive: true, stockQuantity: 12, imageUrl: foodImages[0] },
    { name: "提拉米蘇",          categoryType: "food", price: "110", description: "義式經典甜點，手指餅乾搭配馬斯卡邦", isActive: true, stockQuantity: 8,  imageUrl: foodImages[1] },
    { name: "布朗尼",            categoryType: "food", price: "75",  description: "比利時黑巧克力製作，濕潤濃郁", isActive: true, stockQuantity: 3, imageUrl: foodImages[2] },
    { name: "貝果佐奶油乳酪",    categoryType: "food", price: "95",  description: "紐約風格貝果，搭配自製奶油乳酪", isActive: true, stockQuantity: 10, imageUrl: foodImages[3] },
    { name: "焦糖千層蛋糕",      categoryType: "food", price: "130", description: "20層薄餅搭配焦糖奶油醬，入口即化", isActive: true, stockQuantity: 2, imageUrl: foodImages[4] },

    // 藝術品
    { name: "《晨光咖啡》水彩畫",  categoryType: "artwork", price: "3800", description: "Maya Chen 原創水彩，描繪早晨窗邊的咖啡時光，40×50cm", isActive: true, stockQuantity: 1, isLimited: true, artistId: mayaId, imageUrl: artImages[0] },
    { name: "《城市角落》插畫",    categoryType: "artwork", price: "2500", description: "Maya Chen 限量版數位輸出，描繪台北街角的午後光景，30×40cm", isActive: true, stockQuantity: 2, isLimited: true, artistId: mayaId, imageUrl: artImages[1] },
    { name: "《夢境》數位藝術",    categoryType: "artwork", price: "1800", description: "Luna Kim 數位藝術印刷，夢幻色彩層次，附精美框架，A3尺寸", isActive: true, stockQuantity: 5, isLimited: true, artistId: lunaId, imageUrl: artImages[2] },

    // 周邊商品
    { name: "藝術家限定馬克杯",  categoryType: "merchandise", price: "380", description: "Maya Chen 聯名設計，陶瓷材質，容量350ml，可進洗碗機", isActive: true, stockQuantity: 25, imageUrl: merchImages[0] },
    { name: "帆布托特包",        categoryType: "merchandise", price: "280", description: "100% 有機棉帆布，Luna Kim 插畫印刷，附內袋", isActive: true, stockQuantity: 30, imageUrl: merchImages[1] },
    { name: "藝術家明信片組",    categoryType: "merchandise", price: "180", description: "三位藝術家各2款，共6張明信片，精美禮盒包裝", isActive: true, stockQuantity: 50, imageUrl: merchImages[2] },
  ];

  const savedIds: string[] = [];
  for (const p of products) {
    const obj = new Parse.Object("Product");
    const { categoryType, artistId, ...rest } = p;
    obj.set(rest);
    obj.set("categoryId", ptr("Category", cats[categoryType]));
    if (artistId) obj.set("artistId", ptr("Artist", artistId));
    await obj.save();
    savedIds.push(obj.id);
    console.log(`  ✓ ${p.name} $${p.price} (${obj.id})`);
  }
  return savedIds;
}

// ── 4. Customer ───────────────────────────────────────────
async function seedCustomers() {
  console.log("👥 建立 Customers...");
  const data = [
    { name: "林小芳", email: "lin.xf@gmail.com",   phone: "0912-345-678", loyaltyPoints: 1520, totalSpent: "12800" },
    { name: "陳大明", email: "chen.dm@gmail.com",   phone: "0923-456-789", loyaltyPoints: 880,  totalSpent: "7400"  },
    { name: "王怡君", email: "wang.yj@gmail.com",   phone: "0934-567-890", loyaltyPoints: 650,  totalSpent: "5500"  },
    { name: "張建國", email: "zhang.jg@gmail.com",  phone: "0945-678-901", loyaltyPoints: 310,  totalSpent: "2600"  },
    { name: "李美玲", email: "li.ml@gmail.com",     phone: "0956-789-012", loyaltyPoints: 210,  totalSpent: "1800"  },
    { name: "吳志偉", email: "wu.zw@gmail.com",     phone: "0967-890-123", loyaltyPoints: 95,   totalSpent: "800"   },
    { name: "黃雅婷", email: "huang.yt@gmail.com",  phone: "0978-901-234", loyaltyPoints: 50,   totalSpent: "420"   },
    { name: "趙家豪", email: "",                     phone: "0989-012-345", loyaltyPoints: 10,   totalSpent: "120"   },
  ];

  const savedIds: string[] = [];
  for (const d of data) {
    const obj = new Parse.Object("Customer");
    obj.set(d);
    await obj.save();
    savedIds.push(obj.id);
    console.log(`  ✓ ${d.name} (${d.loyaltyPoints}pts) (${obj.id})`);
  }
  return savedIds;
}

// ── 5. Order ──────────────────────────────────────────────
async function seedOrders() {
  console.log("🧾 建立 Orders...");

  // prettier-ignore
  const orders = [
    // 今日 — completed
    { orderNumber: "ORD-2024-001", orderStatus: "completed", orderType: "內用", total: "285", paymentMethod: "card",  tableNumber: 3,  customer: { name: "林小芳" }, createdAt: hoursAgo(1)  },
    { orderNumber: "ORD-2024-002", orderStatus: "completed", orderType: "外帶", total: "150", paymentMethod: "cash",  tableNumber: null, customer: null,             createdAt: hoursAgo(2)  },
    { orderNumber: "ORD-2024-003", orderStatus: "completed", orderType: "內用", total: "430", paymentMethod: "card",  tableNumber: 7,  customer: { name: "王怡君" }, createdAt: hoursAgo(2)  },
    { orderNumber: "ORD-2024-004", orderStatus: "completed", orderType: "外帶", total: "220", paymentMethod: "cash",  tableNumber: null, customer: null,             createdAt: hoursAgo(3)  },
    { orderNumber: "ORD-2024-005", orderStatus: "completed", orderType: "內用", total: "580", paymentMethod: "card",  tableNumber: 2,  customer: { name: "陳大明" }, createdAt: hoursAgo(3)  },
    { orderNumber: "ORD-2024-006", orderStatus: "completed", orderType: "外送", total: "320", paymentMethod: "線上", tableNumber: null, customer: { name: "張建國" }, createdAt: hoursAgo(4) },
    { orderNumber: "ORD-2024-007", orderStatus: "completed", orderType: "內用", total: "195", paymentMethod: "cash",  tableNumber: 5,  customer: null,              createdAt: hoursAgo(4)  },
    { orderNumber: "ORD-2024-008", orderStatus: "completed", orderType: "外帶", total: "260", paymentMethod: "card",  tableNumber: null, customer: null,             createdAt: hoursAgo(5)  },
    // 今日 — preparing / pending
    { orderNumber: "ORD-2024-009", orderStatus: "preparing", orderType: "內用", total: "310", paymentMethod: "card",  tableNumber: 8,  customer: { name: "李美玲" }, createdAt: hoursAgo(0)  },
    { orderNumber: "ORD-2024-010", orderStatus: "preparing", orderType: "外帶", total: "140", paymentMethod: "cash",  tableNumber: null, customer: null,             createdAt: hoursAgo(0)  },
    { orderNumber: "ORD-2024-011", orderStatus: "pending",   orderType: "外送", total: "475", paymentMethod: "線上", tableNumber: null, customer: { name: "黃雅婷" }, createdAt: hoursAgo(0) },
    // 今日 — cancelled
    { orderNumber: "ORD-2024-012", orderStatus: "cancelled", orderType: "外帶", total: "120", paymentMethod: "cash",  tableNumber: null, customer: null,             createdAt: hoursAgo(6)  },
    // 昨日
    { orderNumber: "ORD-2023-098", orderStatus: "completed", orderType: "內用", total: "340", paymentMethod: "card",  tableNumber: 4,  customer: { name: "林小芳" }, createdAt: daysAgo(1)  },
    { orderNumber: "ORD-2023-099", orderStatus: "completed", orderType: "外帶", total: "280", paymentMethod: "cash",  tableNumber: null, customer: null,             createdAt: daysAgo(1)  },
    { orderNumber: "ORD-2023-100", orderStatus: "completed", orderType: "內用", total: "520", paymentMethod: "card",  tableNumber: 6,  customer: { name: "吳志偉" }, createdAt: daysAgo(1)  },
    // 更早
    { orderNumber: "ORD-2023-090", orderStatus: "completed", orderType: "外帶", total: "165", paymentMethod: "cash",  tableNumber: null, customer: null,             createdAt: daysAgo(3)  },
    { orderNumber: "ORD-2023-085", orderStatus: "completed", orderType: "內用", total: "890", paymentMethod: "card",  tableNumber: 1,  customer: { name: "陳大明" }, createdAt: daysAgo(5)  },
    { orderNumber: "ORD-2023-080", orderStatus: "completed", orderType: "外送", total: "600", paymentMethod: "線上", tableNumber: null, customer: { name: "趙家豪" }, createdAt: daysAgo(7) },
  ];

  for (const o of orders) {
    const obj = new Parse.Object("Order");
    const { createdAt, ...rest } = o;
    obj.set(rest);
    // Note: Parse doesn't allow setting createdAt directly,
    // but we can set an extra field for display purposes or use updatedAt workaround.
    // For seed purposes, just save without createdAt override.
    await obj.save();
    console.log(`  ✓ ${o.orderNumber} ${o.orderStatus} $${o.total} (${obj.id})`);
  }
}

// ── 6. InventoryItem ──────────────────────────────────────
async function seedInventoryItems() {
  console.log("📦 建立 InventoryItems...");

  const items = [
    // 正常庫存
    { name: "衣索比亞咖啡豆",  description: "精品單品豆，中烘焙",        currentStock: 8.5,  minStockLevel: 2,   unit: "kg",  unitCost: 1200 },
    { name: "哥倫比亞咖啡豆",  description: "商業拼配用豆，深烘焙",       currentStock: 15,   minStockLevel: 5,   unit: "kg",  unitCost: 800  },
    { name: "全脂鮮奶",        description: "每日新鮮配送",               currentStock: 24,   minStockLevel: 10,  unit: "公升", unitCost: 70   },
    { name: "燕麥奶",          description: "植物奶替代選項",              currentStock: 12,   minStockLevel: 4,   unit: "公升", unitCost: 120  },
    { name: "日本宇治抹茶粉",  description: "頂級抹茶粉，來自宇治",        currentStock: 1.2,  minStockLevel: 0.5, unit: "kg",  unitCost: 3500 },
    { name: "焦糖糖漿",        description: "Monin 義大利風味糖漿",        currentStock: 6,    minStockLevel: 2,   unit: "瓶",  unitCost: 280  },
    { name: "玫瑰糖漿",        description: "天然玫瑰花萃取糖漿",          currentStock: 3,    minStockLevel: 1,   unit: "瓶",  unitCost: 320  },
    { name: "紙咖啡杯 (中杯)", description: "12oz 環保材質紙杯",           currentStock: 500,  minStockLevel: 100, unit: "個",  unitCost: 4    },
    { name: "紙咖啡杯 (大杯)", description: "16oz 環保材質紙杯",           currentStock: 350,  minStockLevel: 100, unit: "個",  unitCost: 5    },
    // 低庫存（觸發警告）
    { name: "奶油可頌生麵團",  description: "法式可頌預製生麵，冷凍配送",  currentStock: 8,    minStockLevel: 10,  unit: "個",  unitCost: 45   },
    { name: "比利時黑巧克力",  description: "72% 可可含量，布朗尼專用",    currentStock: 0.4,  minStockLevel: 1,   unit: "kg",  unitCost: 650  },
    { name: "馬斯卡邦乳酪",    description: "提拉米蘇專用義大利乳酪",      currentStock: 0.8,  minStockLevel: 1.5, unit: "kg",  unitCost: 420  },
  ];

  for (const item of items) {
    const obj = new Parse.Object("InventoryItem");
    obj.set(item);
    await obj.save();
    const isLow = item.currentStock <= item.minStockLevel;
    console.log(`  ${isLow ? "⚠️" : "✓"} ${item.name} ${item.currentStock}${item.unit} (${obj.id})`);
  }
}

// ── 7. Supplier ───────────────────────────────────────────
async function seedSuppliers() {
  console.log("🏭 建立 Suppliers...");
  const data = [
    {
      name: "精品咖啡豆進口商",
      contactName: "李文傑",
      email: "lee@coffeebeans.tw",
      phone: "02-2345-6789",
      address: "台北市大安區仁愛路三段 88 號",
      category: "咖啡豆",
      leadTimeDays: 7,
    },
    {
      name: "台農乳品有限公司",
      contactName: "黃靜宜",
      email: "huang@dairyfarm.tw",
      phone: "03-456-7890",
      address: "桃園市中壢區農業路 22 號",
      category: "乳製品",
      leadTimeDays: 2,
    },
    {
      name: "環保包裝材料行",
      contactName: "蔡政宏",
      email: "tsai@ecopack.tw",
      phone: "02-3456-7890",
      address: "新北市板橋區文化路 100 號",
      category: "包裝材料",
      leadTimeDays: 5,
    },
  ];

  for (const d of data) {
    const obj = new Parse.Object("Supplier");
    obj.set(d);
    await obj.save();
    console.log(`  ✓ ${d.name} (${obj.id})`);
  }
}

// ── 8. ArtworkSubmission ──────────────────────────────────
async function seedArtworkSubmissions(artistIds: string[]) {
  console.log("🖼️  建立 ArtworkSubmissions...");
  const [, , alexId, riverId] = artistIds;

  const data = [
    {
      title: "《台北印象》攝影系列",
      artistName: "Alex Wu",
      artistId: ptr("Artist", alexId),
      description: "一組共 5 張黑白攝影作品，記錄台北各區的人文景觀，A3 輸出裱框。",
      suggestedPrice: 2200,
      status: "pending",
      medium: "攝影",
      dimensions: "A3 (29.7×42cm)",
    },
    {
      title: "《夕陽油畫》系列 No.1",
      artistName: "River Lee",
      artistId: ptr("Artist", riverId),
      description: "油畫，描繪台灣東海岸夕陽漁港景色，充滿暖色光影變化，60×80cm。",
      suggestedPrice: 5500,
      status: "pending",
      medium: "油畫",
      dimensions: "60×80cm",
    },
    {
      title: "《山嵐晨霧》水彩",
      artistName: "River Lee",
      artistId: ptr("Artist", riverId),
      description: "清晨薄霧瀰漫的山林景色，宣紙水彩，氣韻幽靜。",
      suggestedPrice: 3200,
      status: "pending",
      medium: "水彩",
      dimensions: "30×40cm",
    },
  ];

  for (const d of data) {
    const obj = new Parse.Object("ArtworkSubmission");
    obj.set(d);
    await obj.save();
    console.log(`  ✓ ${d.title} by ${d.artistName} (${obj.id})`);
  }
}

// ── 主程式 ────────────────────────────────────────────────
async function main() {
  console.log("🌱 CaféArt POS 測試資料種子腳本\n");

  try {
    const cats     = await seedCategories();
    const artists  = await seedArtists();
    await seedProducts(cats, artists);
    await seedCustomers();
    await seedOrders();
    await seedInventoryItems();
    await seedSuppliers();
    await seedArtworkSubmissions(artists);

    console.log("\n✅ 所有測試資料已成功建立！");
    console.log("   請前往 Back4App Dashboard 確認資料。");
  } catch (err: any) {
    console.error("\n❌ 種子腳本執行失敗：", err.message ?? err);
    if (err.code) console.error("   Parse 錯誤碼：", err.code);
    process.exit(1);
  }
}

main();
