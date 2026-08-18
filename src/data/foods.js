export const foods = {
  fonio: {
    term: "fonio",
    category: "grain",
    common_name: "Fonio",
    scientific_name: "Digitaria exilis",
    origin_regions: ["West Africa"],
    countries: ["Nigeria", "Senegal", "Mali", "Guinea", "Burkina Faso"],
    local_names: ["Acha", "Fonio"],
    aliases: ["acha"],
    description:
      "Fonio is an ancient African grain cultivated mainly in West Africa. It is valued for its nutritional qualities, fast growth, and adaptability to dry environments.",
    uses: ["Porridge", "Couscous-style dishes", "Flour", "Baked products"],
    nutrition: {
      rich_in: ["fiber", "iron", "amino acids"]
    }
  },

  millet: {
    term: "millet",
    category: "grain",
    common_name: "Millet",
    scientific_name: "Pennisetum glaucum",
    origin_regions: ["West Africa", "Sahel"],
    countries: ["Nigeria", "Niger", "Mali", "Senegal", "Burkina Faso"],
    local_names: ["Pearl millet"],
    aliases: ["pearl millet"],
    description:
      "Millet is a drought-tolerant cereal widely cultivated and consumed across Africa, particularly in the Sahel and West Africa.",
    uses: ["Porridge", "Flour", "Couscous-style dishes", "Traditional beverages"],
    nutrition: {
      rich_in: ["fiber", "protein", "minerals"]
    }
  },

  sorghum: {
    term: "sorghum",
    category: "grain",
    common_name: "Sorghum",
    scientific_name: "Sorghum bicolor",
    origin_regions: ["Africa"],
    countries: ["Nigeria", "Niger", "Sudan", "Mali", "Burkina Faso"],
    local_names: ["Guinea corn"],
    aliases: ["guinea corn"],
    description:
      "Sorghum is an important African cereal adapted to warm and relatively dry environments and used widely as a food grain.",
    uses: ["Porridge", "Flour", "Bread", "Traditional beverages"],
    nutrition: {
      rich_in: ["fiber", "protein", "minerals"]
    }
  },

  cassava: {
    term: "cassava",
    category: "root",
    common_name: "Cassava",
    scientific_name: "Manihot esculenta",
    origin_regions: ["West Africa"],
    countries: ["Nigeria", "Ghana", "Cameroon", "Benin", "Côte d'Ivoire"],
    local_names: ["Cassava"],
    aliases: [],
    description:
      "Cassava is a major tropical root crop cultivated widely in Africa and processed into many traditional and modern food products.",
    uses: ["Garri", "Fufu", "Flour", "Starch"],
    nutrition: {
      rich_in: ["carbohydrates"]
    }
  },

  yam: {
    term: "yam",
    category: "root",
    common_name: "Yam",
    scientific_name: "Dioscorea spp.",
    origin_regions: ["West Africa"],
    countries: ["Nigeria", "Ghana", "Benin", "Togo", "Côte d'Ivoire"],
    local_names: ["Yam"],
    aliases: [],
    description:
      "Yam is an important staple root crop in West Africa and is used in many traditional dishes.",
    uses: ["Boiled", "Pounded yam", "Fried", "Roasted"],
    nutrition: {
      rich_in: ["carbohydrates", "fiber", "potassium"]
    }
  }
};

export const foodAliases = {
  acha: "fonio",
  fonio: "fonio",
  "pearl millet": "millet",
  millet: "millet",
  "guinea corn": "sorghum",
  sorghum: "sorghum",
  cassava: "cassava",
  yam: "yam"
};
