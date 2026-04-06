import { render, screen } from "@testing-library/react";

import Page from "@/app/settings/profile/page";

describe("SettingsProfilePage", () => {
  it("renders the placeholder content", () => {
    render(<Page />);

    expect(screen.getByText("Profile Settings Page")).toBeInTheDocument();
  });
});
