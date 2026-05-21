describe("home", () => {
  it("renders the title", () => {
    cy.visit("/");
    cy.contains("retardmaxxing").should("be.visible");
  });

  it("calls the API health endpoint", () => {
    cy.visit("/");
    cy.contains(/ok|down/, { timeout: 10000 });
  });
});
