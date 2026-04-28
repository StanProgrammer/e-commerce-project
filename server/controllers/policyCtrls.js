const Policy = require("../models/policyModel");
const asyncHandler = require("../middlewares/asyncHandler");

const POLICY_KEY = "terms-and-conditions";

const defaultPolicy = {
  key: POLICY_KEY,
  title: "Terms & Conditions",
  introduction:
    "Please review these terms before buying, selling, or using Willow & Rue. By continuing to use our store, you agree to the policies below.",
  sections: [
    {
      category: "buying",
      title: "Buying Policy",
      content:
        "Orders are accepted when payment is confirmed and product availability is verified. Product prices, offers, taxes, and delivery charges may change before checkout. Customers are responsible for providing accurate shipping and contact information. Returns, exchanges, cancellations, and refunds are handled according to the order status, product condition, and applicable store rules shown at the time of purchase.",
      order: 1,
    },
    {
      category: "selling",
      title: "Selling Policy",
      content:
        "Sellers and administrators must list products with accurate titles, descriptions, images, stock details, and prices. Items must not infringe intellectual property rights or violate applicable laws. Willow & Rue may update, pause, or remove listings that are inaccurate, unavailable, unsafe, or inconsistent with our marketplace standards.",
      order: 2,
    },
    {
      category: "general",
      title: "General Use Policy",
      content:
        "Users must keep account credentials secure and use the platform lawfully. Content, reviews, messages, or actions that are fraudulent, abusive, misleading, or harmful may result in account restrictions. We may update these terms when operational, legal, or service requirements change, and the latest version displayed here will apply.",
      order: 3,
    },
  ],
};

const normalizeSections = (sections = []) =>
  sections.map((section, index) => ({
    ...section,
    order: Number.isFinite(Number(section.order)) ? Number(section.order) : index + 1,
  }));

const getOrCreatePolicy = async () => {
  let policy = await Policy.findOne({ key: POLICY_KEY }).populate("updatedBy", "username email");

  if (!policy) {
    policy = await Policy.create(defaultPolicy);
    policy = await Policy.findById(policy._id).populate("updatedBy", "username email");
  }

  return policy;
};

const getPolicy = asyncHandler(async (req, res) => {
  const policy = await getOrCreatePolicy();
  res.status(200).json({ policy });
});

const updatePolicy = asyncHandler(async (req, res) => {
  const policy = await getOrCreatePolicy();

  policy.title = req.body.title;
  policy.introduction = req.body.introduction;
  policy.sections = normalizeSections(req.body.sections);
  policy.updatedBy = req.user.sub;

  await policy.save();
  await policy.populate("updatedBy", "username email");

  res.status(200).json({
    message: "Policy updated successfully",
    policy,
  });
});

module.exports = {
  getPolicy,
  updatePolicy,
};
