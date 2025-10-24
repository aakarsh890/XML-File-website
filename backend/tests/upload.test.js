import request from "supertest";
import app from "../server.js";
import path from "path";

describe("Report Upload API", () => {
  it("should reject non-XML file", async () => {
    const res = await request(app)
      .post("/api/reports/upload")
      .attach("file", path.join(__dirname, "sample.txt"));
    expect(res.statusCode).toBe(400);
  });
});
