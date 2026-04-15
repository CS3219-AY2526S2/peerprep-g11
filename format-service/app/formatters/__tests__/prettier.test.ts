import { PrettierFormatter } from "../prettier";

describe("PrettierFormatter", () => {
  it("should format javascript code", async () => {
    const formatter = new PrettierFormatter("babel");
    const code = "const x=1;console.log(x)";
    const formatted = await formatter.format(code);
    expect(formatted).toBe('const x = 1;\nconsole.log(x);\n');
  });

  it("should format typescript code", async () => {
    const formatter = new PrettierFormatter("typescript");
    const code = "const x:number=1;console.log(x)";
    const formatted = await formatter.format(code);
    expect(formatted).toBe('const x: number = 1;\nconsole.log(x);\n');
  });

  it("should format css code", async () => {
    const formatter = new PrettierFormatter("css");
    const code = "body{color:red;padding:10px}";
    const formatted = await formatter.format(code);
    expect(formatted).toBe('body {\n  color: red;\n  padding: 10px;\n}\n');
  });

  it("should format html code", async () => {
    const formatter = new PrettierFormatter("html");
    const code = "<div><p>hello world</p></div>";
    const formatted = await formatter.format(code);
    expect(formatted).toBe("<div><p>hello world</p></div>\n");
  });

  it("should format json code", async () => {
    const formatter = new PrettierFormatter("json");
    const code = '{"a":1,"b":2}';
    const formatted = await formatter.format(code);
    expect(formatted).toBe('{ "a": 1, "b": 2 }\n');
  });

  it("should format with semi-colon in javascript", async () => {
    const formatter = new PrettierFormatter("babel");
    const code = "const x = 1";
    const formatted = await formatter.format(code);
    expect(formatted).toContain(";");
  });

  it("should use double quotes in javascript", async () => {
    const formatter = new PrettierFormatter("babel");
    const code = "const x = 'hello'";
    const formatted = await formatter.format(code);
    expect(formatted).toContain('"hello"');
  });
});
