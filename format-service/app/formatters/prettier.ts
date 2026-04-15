import * as prettier from "prettier";
import { Formatter } from "./index";

export class PrettierFormatter implements Formatter {
  constructor(private readonly parser: string = "babel") {}

  async format(code: string): Promise<string> {
    return prettier.format(code, {
      parser: this.parser,
      semi: true,
      singleQuote: false,
      tabWidth: 2,
      trailingComma: "all",
      printWidth: 80,
    });
  }
}
