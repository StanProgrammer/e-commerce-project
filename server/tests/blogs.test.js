// Tests for blogCtrls.getAllBlogs — focuses on the includeDrafts boolean
// handling (the string form "false" must not be treated as truthy).
const blogCtrls = require("../controllers/blogCtrls");

jest.mock("../models/blogModel", () => ({
  countDocuments: jest.fn(),
  find: jest.fn(),
}));

const Blog = require("../models/blogModel");

const makeRes = () => {
  const res = {
    statusCode: 200,
    status: jest.fn(function (code) {
      res.statusCode = code;
      return res;
    }),
    json: jest.fn(function (body) {
      res.body = body;
      return res;
    }),
    set: jest.fn(() => res),
  };
  return res;
};

// Mimics the Blog.find() query chain used by getAllBlogs.
const blogQuery = (blogs) => ({
  populate: () => ({
    sort: () => ({
      skip: () => ({
        limit: () => Promise.resolve(blogs),
      }),
    }),
  }),
});

const makeReq = (query, user = null) => ({ query, user });

// asyncHandler forwards controller errors to next, so check next after awaiting.
const runController = async (req, res) => {
  const next = jest.fn();
  await blogCtrls.getAllBlogs(req, res, next);

  if (next.mock.calls.length > 0) {
    throw next.mock.calls[0][0];
  }
};

beforeEach(() => {
  Blog.countDocuments.mockReset();
  Blog.find.mockReset();
});

describe("getAllBlogs — includeDrafts handling", () => {
  it('treats the string "false" the same as absent (does not include drafts)', async () => {
    Blog.countDocuments.mockResolvedValue(0);
    Blog.find.mockImplementation(() => blogQuery([]));

    const req = makeReq({ includeDrafts: "false", page: "1", limit: "12" }, { role: "admin" });
    const res = makeRes();

    await runController(req, res);

    expect(res.statusCode).toBe(200);
    // Drafts must be filtered out even though the raw query value is the
    // truthy string "false".
    expect(Blog.countDocuments).toHaveBeenCalledWith({
      isDeleted: false,
      isPublished: true,
    });
  });

  it("includes drafts only for admins when includeDrafts is a real true boolean", async () => {
    Blog.countDocuments.mockResolvedValue(1);
    Blog.find.mockImplementation(() => blogQuery([{ _id: "b1", title: "Draft" }]));

    const req = makeReq({ includeDrafts: true, page: "1", limit: "12" }, { role: "admin" });
    const res = makeRes();

    await runController(req, res);

    expect(res.statusCode).toBe(200);
    expect(Blog.countDocuments).toHaveBeenCalledWith({ isDeleted: false });
  });

  it("never exposes drafts to non-admin users, even with includeDrafts=true", async () => {
    Blog.countDocuments.mockResolvedValue(0);
    Blog.find.mockImplementation(() => blogQuery([]));

    const req = makeReq({ includeDrafts: true, page: "1", limit: "12" }, { role: "user" });
    const res = makeRes();

    await runController(req, res);

    expect(res.statusCode).toBe(200);
    expect(Blog.countDocuments).toHaveBeenCalledWith({
      isDeleted: false,
      isPublished: true,
    });
  });

  it("paginates the result set", async () => {
    Blog.countDocuments.mockResolvedValue(25);
    Blog.find.mockImplementation(() => blogQuery([{ _id: "b1" }]));

    const req = makeReq({ page: "2", limit: "5" });
    const res = makeRes();

    await runController(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        totalBlogs: 25,
        totalPages: 5,
        currentPage: 2,
        blogs: [{ _id: "b1" }],
      })
    );
  });
});
