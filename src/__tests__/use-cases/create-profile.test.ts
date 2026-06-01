import { describe, it, expect } from "vitest";
import { CreateProfileUseCase } from "@/domains/client-knowledge/use-cases/create-profile";
import { FakeCompanyProfileRepository } from "../fakes";

describe("CreateProfileUseCase", () => {
  function setup() {
    const profileRepo = new FakeCompanyProfileRepository();
    const useCase = new CreateProfileUseCase(profileRepo);
    return { profileRepo, useCase };
  }

  it("should create a profile with the correct data", async () => {
    const { useCase } = setup();

    const result = await useCase.execute({
      name: "Acme Corp",
      sector: "SaaS B2B",
      description: "Cloud-based project management tool",
      target: "Marketing directors in mid-size companies",
      brandTone: "Professional yet approachable",
    });

    expect(result.isOk()).toBe(true);
    const profile = result.value;
    expect(profile.id).toBeDefined();
    expect(profile.name).toBe("Acme Corp");
    expect(profile.sector).toBe("SaaS B2B");
    expect(profile.description).toBe("Cloud-based project management tool");
    expect(profile.target).toBe("Marketing directors in mid-size companies");
    expect(profile.brandTone).toBe("Professional yet approachable");
    expect(profile.createdAt).toBeDefined();
    expect(profile.updatedAt).toBeDefined();
  });

  it("should persist the profile in the repository", async () => {
    const { profileRepo, useCase } = setup();

    expect(await profileRepo.get()).toBeNull();

    const result = await useCase.execute({
      name: "TechStart",
      sector: "EdTech",
      description: "Online learning platform for developers",
      target: "Junior developers",
      brandTone: "Casual and encouraging",
    });

    expect(result.isOk()).toBe(true);
    const saved = await profileRepo.get();
    expect(saved).not.toBeNull();
    expect(saved!.id).toBe(result.value.id);
    expect(saved!.name).toBe("TechStart");
    expect(saved!.sector).toBe("EdTech");
  });

  it("should update the profile on a second save", async () => {
    const { profileRepo, useCase } = setup();

    await useCase.execute({
      name: "Original Corp",
      sector: "Finance",
      description: "Original description for company",
      target: "CFOs",
      brandTone: "Formal",
    });

    const result = await useCase.execute({
      name: "Updated Corp",
      sector: "FinTech",
      description: "Updated description for company",
      target: "CFOs and CTOs",
      brandTone: "Modern formal",
    });

    expect(result.isOk()).toBe(true);
    const saved = await profileRepo.get();
    expect(saved!.name).toBe("Updated Corp");
    expect(saved!.sector).toBe("FinTech");
    expect(saved!.description).toBe("Updated description for company");
  });
});
