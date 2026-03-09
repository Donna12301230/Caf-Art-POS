export interface Department {
  college: string;
  name: string;
}

export const NCYU_COLLEGES = [
  {
    name: "師範學院",
    departments: [
      "教育學系", "數位學習設計與管理學系", "特殊教育學系",
      "輔導與諮商學系", "幼兒教育學系", "體育與健康休閒學系"
    ]
  },
  {
    name: "人文藝術學院",
    departments: [
      "中國文學系", "外國語言學系", "應用歷史學系", "視覺藝術學系", "音樂學系"
    ]
  },
  {
    name: "管理學院",
    departments: [
      "企業管理學系", "應用經濟學系", "科技管理學系",
      "資訊管理學系", "財務金融學系", "行銷與觀光管理學系"
    ]
  },
  {
    name: "農學院",
    departments: [
      "農藝學系", "園藝學系", "森林暨自然資源學系", "木質材料與設計學系",
      "動物科學系", "農業生物科技學系", "景觀學系", "植物醫學系"
    ]
  },
  {
    name: "理工學院",
    departments: [
      "電子物理學系", "應用數學系", "應用化學系", "資訊工程學系",
      "生物機電工程學系", "土木與水資源工程學系", "電機工程學系", "機械與能源工程學系"
    ]
  },
  {
    name: "生命科學院",
    departments: [
      "食品科學系", "生化科技學系", "水生生物科學系", "生物資源學系", "微生物免疫與生物藥學系"
    ]
  },
  {
    name: "獸醫學院",
    departments: ["獸醫學系"]
  }
];

// Flat list for quick lookup
export const ALL_DEPARTMENTS: Department[] = NCYU_COLLEGES.flatMap(college =>
  college.departments.map(name => ({ college: college.name, name }))
);

// Ordered unit options (including non-department units)
export const ORDER_UNIT_OPTIONS = [
  "個人",
  ...NCYU_COLLEGES.flatMap(c => c.departments.map(d => `${c.name} ${d}`)),
  "學生宿舍",
  "其他單位",
];
