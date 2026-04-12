import { render, screen } from "@testing-library/react";

import {
  isPasswordValid,
  PASSWORD_MIN_LENGTH,
  PasswordCriteria,
  passwordLengthValid,
  passwordUppercaseValid,
} from "@/lib/passwordValidation";

describe("password validation helpers", () => {
  it("validates the minimum password length", () => {
    expect(passwordLengthValid("Short7")).toBe(false);
    expect(
      passwordLengthValid("A".repeat(PASSWORD_MIN_LENGTH))
    ).toBe(true);
  });

  it("validates the uppercase password requirement", () => {
    expect(passwordUppercaseValid("lowercase123")).toBe(false);
    expect(passwordUppercaseValid("Uppercase123")).toBe(true);
  });

  it("validates the full password rule set", () => {
    expect(isPasswordValid("lowercase123")).toBe(false);
    expect(isPasswordValid("ValidPass123")).toBe(true);
  });
});

describe("PasswordCriteria", () => {
  it("renders nothing for an empty password", () => {
    const { container } = render(<PasswordCriteria password="" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the checklist for a non-empty password", () => {
    render(<PasswordCriteria password="lowercase123" />);

    expect(
      screen.getByText(`Minimum ${PASSWORD_MIN_LENGTH} characters`)
    ).toBeInTheDocument();
    expect(
      screen.getByText("At least one uppercase letter")
    ).toBeInTheDocument();
  });
});
