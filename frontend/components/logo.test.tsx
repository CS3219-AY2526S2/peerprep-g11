import { render } from "@testing-library/react";

import { Logo } from "@/components/logo";

describe("Logo", () => {
  it("renders an accessible decorative logo with merged classes", () => {
    const { container } = render(<Logo className="text-accent" />);

    const svg = container.querySelector("svg");

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("w-[26px]");
    expect(svg).toHaveClass("h-[26px]");
    expect(svg).toHaveClass("text-accent");
  });
});
