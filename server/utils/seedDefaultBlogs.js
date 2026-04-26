const Blog = require("../models/blogModel");
const defaultBlogs = require("../data/defaultBlogs");

const seedDefaultBlogs = async () => {
  await Promise.all(
    defaultBlogs.map((blog) =>
      Blog.updateOne(
        { slug: blog.slug },
        { $setOnInsert: blog },
        { upsert: true }
      )
    )
  );
};

module.exports = seedDefaultBlogs;
