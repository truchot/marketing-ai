import { describe, it, expect, vi } from "vitest";
import { CompanyProfileAggregate } from "@/domains/client-knowledge/aggregates";

describe("CompanyProfileAggregate", () => {
  describe("create", () => {
    it("should create a valid company profile with all required fields", () => {
      const profile = CompanyProfileAggregate.create({
        name: "Acme Corp",
        sector: "SaaS B2B",
        description: "Cloud-based project management tool for teams",
        target: "Marketing directors in mid-size companies",
        brandTone: "Professional yet approachable",
      });

      expect(profile.id).toMatch(/^company-\d+-[a-z0-9]+$/);
      expect(profile.name).toBe("Acme Corp");
      expect(profile.sector).toBe("SaaS B2B");
      expect(profile.description).toBe(
        "Cloud-based project management tool for teams"
      );
      expect(profile.target).toBe("Marketing directors in mid-size companies");
      expect(profile.brandTone).toBe("Professional yet approachable");
      expect(profile.discoveryId).toBeUndefined();
      expect(profile.createdAt).toBeDefined();
      expect(profile.updatedAt).toBeDefined();
    });

    it("should trim whitespace from all fields", () => {
      const profile = CompanyProfileAggregate.create({
        name: "  Acme Corp  ",
        sector: "  SaaS B2B  ",
        description: "  Cloud platform for teams  ",
        target: "  Marketing directors  ",
        brandTone: "  Professional  ",
      });

      expect(profile.name).toBe("Acme Corp");
      expect(profile.sector).toBe("SaaS B2B");
      expect(profile.description).toBe("Cloud platform for teams");
      expect(profile.target).toBe("Marketing directors");
      expect(profile.brandTone).toBe("Professional");
    });

    it("should reject name shorter than 2 characters", () => {
      expect(() =>
        CompanyProfileAggregate.create({
          name: "A",
          sector: "Tech",
          description: "A tech company",
          target: "Developers",
          brandTone: "Professional",
        })
      ).toThrow("Company name must be at least 2 characters long");
    });

    it("should reject empty name after trimming", () => {
      expect(() =>
        CompanyProfileAggregate.create({
          name: "   ",
          sector: "Tech",
          description: "A tech company",
          target: "Developers",
          brandTone: "Professional",
        })
      ).toThrow("Company name must be at least 2 characters long");
    });

    it("should reject empty sector", () => {
      expect(() =>
        CompanyProfileAggregate.create({
          name: "Acme Corp",
          sector: "",
          description: "A tech company",
          target: "Developers",
          brandTone: "Professional",
        })
      ).toThrow("Company sector cannot be empty");
    });

    it("should reject description shorter than 10 characters", () => {
      expect(() =>
        CompanyProfileAggregate.create({
          name: "Acme Corp",
          sector: "Tech",
          description: "Short",
          target: "Developers",
          brandTone: "Professional",
        })
      ).toThrow("Company description must be at least 10 characters long");
    });

    it("should reject empty target audience", () => {
      expect(() =>
        CompanyProfileAggregate.create({
          name: "Acme Corp",
          sector: "Tech",
          description: "A tech company description",
          target: "",
          brandTone: "Professional",
        })
      ).toThrow("Company target audience cannot be empty");
    });

    it("should reject empty brand tone", () => {
      expect(() =>
        CompanyProfileAggregate.create({
          name: "Acme Corp",
          sector: "Tech",
          description: "A tech company description",
          target: "Developers",
          brandTone: "",
        })
      ).toThrow("Company brand tone cannot be empty");
    });
  });

  describe("fromPersisted", () => {
    it("should reconstitute profile from DTO without raising events", () => {
      const dto = {
        id: "company-1700000000000-abc123",
        name: "TechStart",
        sector: "EdTech",
        description: "Online learning platform for developers",
        target: "Junior developers",
        brandTone: "Casual and encouraging",
        discoveryId: "discovery-123",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-02T00:00:00.000Z",
      };

      const profile = CompanyProfileAggregate.fromPersisted(dto);

      expect(profile.id).toBe("company-1700000000000-abc123");
      expect(profile.name).toBe("TechStart");
      expect(profile.sector).toBe("EdTech");
      expect(profile.discoveryId).toBe("discovery-123");
      expect(profile.createdAt).toBe("2024-01-01T00:00:00.000Z");
      expect(profile.updatedAt).toBe("2024-01-02T00:00:00.000Z");
      expect(profile.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe("updateDescription", () => {
    it("should update description successfully", () => {
      vi.useFakeTimers();
      try {
        vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
        const profile = CompanyProfileAggregate.create({
          name: "Acme Corp",
          sector: "Tech",
          description: "Original description text here",
          target: "Developers",
          brandTone: "Professional",
        });

        const originalUpdatedAt = profile.updatedAt;

        vi.setSystemTime(new Date("2025-01-01T00:00:01.000Z"));
        profile.updateDescription(
          "New and improved description for the company"
        );

        expect(profile.description).toBe(
          "New and improved description for the company"
        );
        expect(profile.updatedAt).not.toBe(originalUpdatedAt);
      } finally {
        vi.useRealTimers();
      }
    });

    it("should reject description shorter than 10 characters", () => {
      const profile = CompanyProfileAggregate.create({
        name: "Acme Corp",
        sector: "Tech",
        description: "Original description text",
        target: "Developers",
        brandTone: "Professional",
      });

      expect(() => profile.updateDescription("Short")).toThrow(
        "Company description must be at least 10 characters long"
      );
    });
  });

  describe("updateName", () => {
    it("should update name successfully", () => {
      const profile = CompanyProfileAggregate.create({
        name: "Original Name",
        sector: "Tech",
        description: "A tech company description",
        target: "Developers",
        brandTone: "Professional",
      });

      profile.updateName("New Name");

      expect(profile.name).toBe("New Name");
    });

    it("should reject name shorter than 2 characters", () => {
      const profile = CompanyProfileAggregate.create({
        name: "Original Name",
        sector: "Tech",
        description: "A tech company description",
        target: "Developers",
        brandTone: "Professional",
      });

      expect(() => profile.updateName("A")).toThrow(
        "Company name must be at least 2 characters long"
      );
    });
  });

  describe("updateSector", () => {
    it("should update sector successfully", () => {
      const profile = CompanyProfileAggregate.create({
        name: "Acme Corp",
        sector: "Tech",
        description: "A tech company description",
        target: "Developers",
        brandTone: "Professional",
      });

      profile.updateSector("FinTech");

      expect(profile.sector).toBe("FinTech");
    });

    it("should reject empty sector", () => {
      const profile = CompanyProfileAggregate.create({
        name: "Acme Corp",
        sector: "Tech",
        description: "A tech company description",
        target: "Developers",
        brandTone: "Professional",
      });

      expect(() => profile.updateSector("")).toThrow(
        "Company sector cannot be empty"
      );
    });
  });

  describe("updateTarget", () => {
    it("should update target audience successfully", () => {
      const profile = CompanyProfileAggregate.create({
        name: "Acme Corp",
        sector: "Tech",
        description: "A tech company description",
        target: "Developers",
        brandTone: "Professional",
      });

      profile.updateTarget("Senior developers and CTOs");

      expect(profile.target).toBe("Senior developers and CTOs");
    });

    it("should reject empty target", () => {
      const profile = CompanyProfileAggregate.create({
        name: "Acme Corp",
        sector: "Tech",
        description: "A tech company description",
        target: "Developers",
        brandTone: "Professional",
      });

      expect(() => profile.updateTarget("")).toThrow(
        "Company target audience cannot be empty"
      );
    });
  });

  describe("updateBrandTone", () => {
    it("should update brand tone successfully", () => {
      const profile = CompanyProfileAggregate.create({
        name: "Acme Corp",
        sector: "Tech",
        description: "A tech company description",
        target: "Developers",
        brandTone: "Professional",
      });

      profile.updateBrandTone("Casual and friendly");

      expect(profile.brandTone).toBe("Casual and friendly");
    });

    it("should reject empty brand tone", () => {
      const profile = CompanyProfileAggregate.create({
        name: "Acme Corp",
        sector: "Tech",
        description: "A tech company description",
        target: "Developers",
        brandTone: "Professional",
      });

      expect(() => profile.updateBrandTone("")).toThrow(
        "Company brand tone cannot be empty"
      );
    });
  });

  describe("linkDiscovery", () => {
    it("should link discovery successfully", () => {
      const profile = CompanyProfileAggregate.create({
        name: "Acme Corp",
        sector: "Tech",
        description: "A tech company description",
        target: "Developers",
        brandTone: "Professional",
      });

      expect(profile.hasDiscoveryLinked()).toBe(false);

      profile.linkDiscovery("discovery-abc123");

      expect(profile.discoveryId).toBe("discovery-abc123");
      expect(profile.hasDiscoveryLinked()).toBe(true);
    });

    it("should reject linking discovery twice (immutability invariant)", () => {
      const profile = CompanyProfileAggregate.create({
        name: "Acme Corp",
        sector: "Tech",
        description: "A tech company description",
        target: "Developers",
        brandTone: "Professional",
      });

      profile.linkDiscovery("discovery-first");

      expect(() => profile.linkDiscovery("discovery-second")).toThrow(
        "Discovery already linked to this profile (discovery-first). Cannot link again."
      );
    });

    it("should reject empty discovery ID", () => {
      const profile = CompanyProfileAggregate.create({
        name: "Acme Corp",
        sector: "Tech",
        description: "A tech company description",
        target: "Developers",
        brandTone: "Professional",
      });

      expect(() => profile.linkDiscovery("")).toThrow(
        "Discovery ID cannot be empty"
      );
    });
  });

  describe("hasDiscoveryLinked", () => {
    it("should return false when no discovery is linked", () => {
      const profile = CompanyProfileAggregate.create({
        name: "Acme Corp",
        sector: "Tech",
        description: "A tech company description",
        target: "Developers",
        brandTone: "Professional",
      });

      expect(profile.hasDiscoveryLinked()).toBe(false);
    });

    it("should return true when discovery is linked", () => {
      const profile = CompanyProfileAggregate.create({
        name: "Acme Corp",
        sector: "Tech",
        description: "A tech company description",
        target: "Developers",
        brandTone: "Professional",
      });

      profile.linkDiscovery("discovery-123");

      expect(profile.hasDiscoveryLinked()).toBe(true);
    });
  });

  describe("toDTO", () => {
    it("should convert aggregate to DTO format", () => {
      const profile = CompanyProfileAggregate.create({
        name: "Acme Corp",
        sector: "SaaS B2B",
        description: "Cloud-based project management tool",
        target: "Marketing directors",
        brandTone: "Professional yet approachable",
      });

      const dto = profile.toDTO();

      expect(dto).toMatchObject({
        id: profile.id,
        name: "Acme Corp",
        sector: "SaaS B2B",
        description: "Cloud-based project management tool",
        target: "Marketing directors",
        brandTone: "Professional yet approachable",
        discoveryId: undefined,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      });
    });

    it("should include discoveryId in DTO when linked", () => {
      const profile = CompanyProfileAggregate.create({
        name: "Acme Corp",
        sector: "Tech",
        description: "A tech company description",
        target: "Developers",
        brandTone: "Professional",
      });

      profile.linkDiscovery("discovery-xyz789");

      const dto = profile.toDTO();

      expect(dto.discoveryId).toBe("discovery-xyz789");
    });
  });

  describe("timestamps", () => {
    it("should update updatedAt timestamp on any modification", () => {
      vi.useFakeTimers();
      try {
        vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
        const profile = CompanyProfileAggregate.create({
          name: "Acme Corp",
          sector: "Tech",
          description: "A tech company description",
          target: "Developers",
          brandTone: "Professional",
        });

        const originalUpdatedAt = profile.updatedAt;

        vi.setSystemTime(new Date("2025-01-01T00:00:01.000Z"));
        profile.updateName("New Acme Corp");

        expect(profile.updatedAt).not.toBe(originalUpdatedAt);
      } finally {
        vi.useRealTimers();
      }
    });

    it("should keep createdAt immutable", () => {
      const profile = CompanyProfileAggregate.create({
        name: "Acme Corp",
        sector: "Tech",
        description: "A tech company description",
        target: "Developers",
        brandTone: "Professional",
      });

      const originalCreatedAt = profile.createdAt;

      profile.updateName("New Name");
      profile.updateDescription("New description for the company");
      profile.updateBrandTone("New tone");

      expect(profile.createdAt).toBe(originalCreatedAt);
    });
  });
});
