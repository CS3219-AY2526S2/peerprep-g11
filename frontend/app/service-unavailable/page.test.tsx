import { render, screen } from "@testing-library/react";

import Page from "@/app/service-unavailable/page";

describe("ServiceUnavailablePage", () => {
  it("renders the placeholder content", () => {
    render(<Page />);

    expect(screen.getByText("Service Unavailable Page")).toBeInTheDocument();
  });
});
