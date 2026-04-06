import { render, screen } from "@testing-library/react";

import { LandingNavbar } from "@/components/landing-navbar";

describe("LandingNavbar", () => {
  it("renders the brand link back to the landing page", () => {
    render(<LandingNavbar />);

    const link = screen.getByRole("link", { name: /peerprep/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
