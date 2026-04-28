const defaultPolicy = {
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

export default defaultPolicy;
