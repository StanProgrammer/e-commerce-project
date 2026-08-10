const {
  colorCode,
  findVariantDuplicate,
  generateSku,
  nameCode,
  normalizeName,
} = require("../utils/sku");

jest.mock("../models/prdModel", () => ({
  exists: jest.fn(),
  findOne: jest.fn(),
}));

const Product = require("../models/prdModel");

beforeEach(() => {
  Product.exists.mockReset();
  Product.findOne.mockReset();
});

describe("normalizeName", () => {
  it("trims leading and trailing whitespace", () => {
    expect(normalizeName("  Watch  ")).toBe("watch");
  });

  it("lowercases the name", () => {
    expect(normalizeName("WATCH")).toBe("watch");
  });

  it("collapses inner whitespace", () => {
    expect(normalizeName("  Watch   Pro ")).toBe("watch pro");
  });

  it("handles empty input", () => {
    expect(normalizeName("")).toBe("");
    expect(normalizeName(undefined)).toBe("");
  });
});

describe("nameCode", () => {
  it("uppercases and keeps alphanumerics", () => {
    expect(nameCode("Watch")).toBe("WATCH");
    expect(nameCode("Linen Shirt")).toBe("LINEN-SHIRT");
  });

  it("caps at 12 characters", () => {
    expect(nameCode("Extraordinary Product")).toBe("EXTRAORDINAR");
  });

  it("falls back to PRD for empty input", () => {
    expect(nameCode("")).toBe("PRD");
  });
});

describe("colorCode", () => {
  it("maps the palette to 3-letter codes", () => {
    expect(colorCode("black")).toBe("BLK");
    expect(colorCode("silver")).toBe("SLV");
    expect(colorCode("gold")).toBe("GLD");
    expect(colorCode("red")).toBe("RED");
    expect(colorCode("blue")).toBe("BLU");
    expect(colorCode("green")).toBe("GRN");
    expect(colorCode("beige")).toBe("BGE");
  });

  it("derives a code for unknown colors", () => {
    expect(colorCode("violet")).toBe("VIO");
  });

  it("falls back to GEN when color is missing", () => {
    expect(colorCode("")).toBe("GEN");
    expect(colorCode(undefined)).toBe("GEN");
  });
});

describe("generateSku", () => {
  it("builds NAME-COLOR-SEQ with a zero-padded sequence", async () => {
    Product.exists.mockResolvedValue(false);

    const sku = await generateSku("Watch", "black");

    expect(sku).toBe("WATCH-BLK-001");
  });

  it("bumps the sequence until it finds a free SKU", async () => {
    Product.exists
      .mockResolvedValueOnce(true) // WATCH-BLK-001 taken
      .mockResolvedValueOnce(true) // WATCH-BLK-002 taken
      .mockResolvedValueOnce(false); // WATCH-BLK-003 free

    const sku = await generateSku("Watch", "black");

    expect(sku).toBe("WATCH-BLK-003");
    expect(Product.exists).toHaveBeenCalledTimes(3);
  });

  it("never reuses a SKU (checks existing docs, not just active ones)", async () => {
    Product.exists.mockResolvedValue(false);

    await generateSku("Watch", "black");

    expect(Product.exists).toHaveBeenCalledWith({ sku: "WATCH-BLK-001" });
  });

  it("produces distinct SKUs for different colors", async () => {
    Product.exists.mockResolvedValue(false);

    const black = await generateSku("Watch", "black");
    const silver = await generateSku("Watch", "silver");

    expect(black).toBe("WATCH-BLK-001");
    expect(silver).toBe("WATCH-SLV-001");
  });
});

describe("findVariantDuplicate", () => {
  it("matches the normalized name case-insensitively", async () => {
    Product.findOne.mockResolvedValue(null);

    await findVariantDuplicate({
      name: "  WATCH ",
      category: "Accessories",
      color: "Black",
    });

    expect(Product.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        name: { $regex: "^watch$", $options: "i" },
        category: "accessories",
        color: "black",
        isDeleted: false,
      })
    );
  });

  it("matches empty colors against both '' and missing fields", async () => {
    Product.findOne.mockResolvedValue(null);

    await findVariantDuplicate({
      name: "Watch",
      category: "accessories",
      color: "",
    });

    expect(Product.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ color: { $in: ["", null] } })
    );
  });

  it("escapes regex metacharacters in the name", async () => {
    Product.findOne.mockResolvedValue(null);

    await findVariantDuplicate({
      name: "C++ Pro",
      category: "clothes",
      color: "red",
    });

    expect(Product.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        name: { $regex: "^c\\+\\+ pro$", $options: "i" },
      })
    );
  });

  it("excludes the given product id (self on update)", async () => {
    Product.findOne.mockResolvedValue(null);

    await findVariantDuplicate({
      name: "Watch",
      category: "accessories",
      color: "black",
      excludeId: "abc123",
    });

    expect(Product.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: { $ne: "abc123" } })
    );
  });
});
