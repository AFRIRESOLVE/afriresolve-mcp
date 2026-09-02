export const dishes = {
  jollof_rice: {
    term: "jollof rice",
    category: "rice_dish",
    common_name: "Jollof rice",
    countries: [
      "Nigeria",
      "Ghana",
      "Senegal",
      "Gambia",
      "Sierra Leone",
      "Liberia",
      "Cameroon"
    ],
    regions: ["West Africa", "Central Africa"],
    aliases: ["jollof", "benachin", "ceebu jen"],
    primary_ingredients: [
      "rice",
      "tomato",
      "pepper",
      "onion",
      "oil"
    ],
    description:
      "A widely known West African rice dish prepared with rice, tomatoes, peppers, onions, and seasonings, with regional variations across countries.",
    related_foods: ["rice", "tomato", "pepper", "onion"]
  },

  egusi_soup: {
    term: "egusi soup",
    category: "soup",
    common_name: "Egusi soup",
    countries: ["Nigeria", "Ghana", "Cameroon"],
    regions: ["West Africa", "Central Africa"],
    aliases: ["egusi", "melon seed soup"],
    primary_ingredients: [
      "egusi",
      "bitter leaf",
      "okra",
      "pepper",
      "onion"
    ],
    description:
      "A thick African soup made primarily with ground egusi seeds and commonly prepared with leafy vegetables, peppers, onions, and other ingredients.",
    related_foods: ["egusi", "bitter_leaf", "okra"]
  },

  pounded_yam: {
    term: "pounded yam",
    category: "swallow",
    common_name: "Pounded yam",
    countries: ["Nigeria", "Ghana", "Cameroon"],
    regions: ["West Africa", "Central Africa"],
    aliases: ["iyan", "pounded yam"],
    primary_ingredients: ["yam"],
    description:
      "A smooth, stretchy staple made by pounding boiled yam and commonly served with African soups and stews.",
    related_foods: ["yam"]
  },

  moi_moi: {
    term: "moi moi",
    category: "steamed_legume_dish",
    common_name: "Moi moi",
    countries: ["Nigeria"],
    regions: ["West Africa"],
    aliases: ["moin moin", "moi-moi"],
    primary_ingredients: [
      "beans",
      "pepper",
      "onion",
      "oil"
    ],
    description:
      "A steamed Nigerian bean pudding prepared from blended beans with peppers, onions, seasoning, and other optional ingredients.",
    related_foods: ["beans", "pepper", "onion"]
  },

  akara: {
    term: "akara",
    category: "fried_legume_dish",
    common_name: "Akara",
    countries: ["Nigeria", "Ghana", "Sierra Leone"],
    regions: ["West Africa"],
    aliases: ["bean cakes", "akara balls"],
    primary_ingredients: [
      "beans",
      "pepper",
      "onion",
      "oil"
    ],
    description:
      "A fried West African bean dish made from seasoned ground beans and commonly eaten as a snack or meal.",
    related_foods: ["beans", "pepper", "onion"]
  }
};

export const dishAliases = {
  "jollof rice": "jollof_rice",
  jollof: "jollof_rice",
  benachin: "jollof_rice",
  "ceebu jen": "jollof_rice",

  "egusi soup": "egusi_soup",
  egusi: "egusi_soup",
  "melon seed soup": "egusi_soup",

  "pounded yam": "pounded_yam",
  iyan: "pounded_yam",

  "moi moi": "moi_moi",
  "moin moin": "moi_moi",
  "moi-moi": "moi_moi",

  akara: "akara",
  "bean cakes": "akara",
  "akara balls": "akara"
};
