export interface Formatter {
  format(code: string): Promise<string>;
}
