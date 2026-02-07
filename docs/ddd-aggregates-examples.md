# DDD Aggregates - Usage Examples

This document provides practical examples of using the DDD aggregates in the Marketing AI project.

## Episode Aggregate Examples

### Example 1: Creating a New Episode

```typescript
import { EpisodeAggregate } from "@/domains/memory/aggregates";
import { domainEventBus } from "@/domains/shared";

// Create a new episode for user interaction
const episode = EpisodeAggregate.create(
  "interaction",
  "User asked about pricing for enterprise plan",
  {
    topic: "pricing",
    plan: "enterprise",
    userIntent: "purchase_consideration"
  },
  {
    tags: ["sales", "pricing", "enterprise"],
    importance: "high"
  }
);

// Publish domain events
const events = episode.getUncommittedEvents();
events.forEach(event => domainEventBus.publish(event));
episode.clearUncommittedEvents();

// Access episode data
console.log(episode.id); // "ep-1234567890-abc12"
console.log(episode.description); // "User asked about pricing for enterprise plan"
console.log(episode.tags); // ["sales", "pricing", "enterprise"]
console.log(episode.importanceLevel); // "high"
```

### Example 2: Adding Tags to an Existing Episode

```typescript
import { EpisodeAggregate } from "@/domains/memory/aggregates";

// Reconstitute from persistence
const episode = EpisodeAggregate.fromPersisted({
  id: "ep-1234567890-abc12",
  type: "interaction",
  description: "User feedback on new feature",
  data: { feature: "dashboard" },
  metadata: {
    tags: ["feedback", "dashboard"],
    importance: "medium",
    timestamp: "2024-01-15T10:30:00.000Z"
  }
});

// Add a new tag
episode.addTag("positive");

// Tags now include the new one
console.log(episode.tags); // ["feedback", "dashboard", "positive"]

// Try to add duplicate - throws error
try {
  episode.addTag("feedback");
} catch (error) {
  console.error(error.message); // 'Tag "feedback" already exists on this episode'
}
```

### Example 3: Upgrading Episode Importance

```typescript
import { EpisodeAggregate } from "@/domains/memory/aggregates";

// Create low-importance episode
const episode = EpisodeAggregate.create(
  "discovery",
  "Found new pattern in user behavior",
  { pattern: "weekend_usage_spike" },
  { tags: ["pattern", "analytics"], importance: "low" }
);

// Later, upgrade importance as pattern proves significant
episode.upgradeImportance("high");

console.log(episode.importanceLevel); // "high"

// Cannot downgrade - throws error
try {
  episode.upgradeImportance("medium");
} catch (error) {
  console.error(error.message); // "Cannot downgrade or keep same importance level"
}
```

### Example 4: Querying Episode Tags

```typescript
import { EpisodeAggregate } from "@/domains/memory/aggregates";

const episode = EpisodeAggregate.create(
  "task_result",
  "Marketing campaign completed successfully",
  { campaign: "summer-sale", roi: 2.5 },
  { tags: ["marketing", "campaign", "success"], importance: "high" }
);

// Check for specific tag
if (episode.hasTag("success")) {
  console.log("Success episode!");
}

// Check for multiple tags
if (episode.hasAllTags(["marketing", "campaign"])) {
  console.log("Marketing campaign episode");
}

// Check importance level
if (episode.isMoreImportantThan("medium")) {
  console.log("High-importance episode - requires attention");
}
```

### Example 5: Converting to DTO for Persistence

```typescript
import { EpisodeAggregate } from "@/domains/memory/aggregates";

const episode = EpisodeAggregate.create(
  "feedback",
  "User loves the new UI design",
  { feature: "ui", sentiment: "positive" },
  { tags: ["feedback", "ui", "positive"], importance: "medium" }
);

// Convert to DTO for persistence
const dto = episode.toDTO();

// Save to database or in-memory store
await repository.save(dto);

// DTO structure matches the Episode interface
console.log(dto);
/*
{
  id: "ep-1234567890-abc12",
  type: "feedback",
  description: "User loves the new UI design",
  data: { feature: "ui", sentiment: "positive" },
  metadata: {
    tags: ["feedback", "ui", "positive"],
    importance: "medium",
    timestamp: "2024-01-15T10:30:00.000Z"
  }
}
*/
```

## CompanyProfile Aggregate Examples

### Example 1: Creating a New Company Profile

```typescript
import { CompanyProfileAggregate } from "@/domains/client-knowledge/aggregates";

// Create a new company profile
const profile = CompanyProfileAggregate.create({
  name: "Acme Corporation",
  sector: "SaaS B2B",
  description: "Cloud-based project management platform for distributed teams",
  target: "Marketing directors and project managers in mid-size companies (50-500 employees)",
  brandTone: "Professional yet approachable, data-driven but human-centered"
});

console.log(profile.id); // "company-1234567890-xyz78"
console.log(profile.name); // "Acme Corporation"
console.log(profile.hasDiscoveryLinked()); // false

// Convert to DTO for persistence
const dto = profile.toDTO();
```

### Example 2: Validation on Creation

```typescript
import { CompanyProfileAggregate } from "@/domains/client-knowledge/aggregates";

// Too short name - throws error
try {
  CompanyProfileAggregate.create({
    name: "A",
    sector: "Tech",
    description: "A tech company",
    target: "Developers",
    brandTone: "Professional"
  });
} catch (error) {
  console.error(error.message); // "Company name must be at least 2 characters long"
}

// Too short description - throws error
try {
  CompanyProfileAggregate.create({
    name: "Acme Corp",
    sector: "Tech",
    description: "Short",
    target: "Developers",
    brandTone: "Professional"
  });
} catch (error) {
  console.error(error.message); // "Company description must be at least 10 characters long"
}

// Empty sector - throws error
try {
  CompanyProfileAggregate.create({
    name: "Acme Corp",
    sector: "",
    description: "A tech company description",
    target: "Developers",
    brandTone: "Professional"
  });
} catch (error) {
  console.error(error.message); // "Company sector cannot be empty"
}
```

### Example 3: Updating Profile Fields

```typescript
import { CompanyProfileAggregate } from "@/domains/client-knowledge/aggregates";

// Create profile
const profile = CompanyProfileAggregate.create({
  name: "StartupX",
  sector: "EdTech",
  description: "Online learning platform for coding bootcamps and universities",
  target: "Computer science students and career changers",
  brandTone: "Casual and encouraging, tech-savvy"
});

// Update description as company evolves
profile.updateDescription(
  "AI-powered online learning platform for coding bootcamps, universities, and corporate training programs"
);

// Update target audience
profile.updateTarget(
  "Computer science students, career changers, and enterprise L&D teams"
);

// Update brand tone
profile.updateBrandTone(
  "Casual yet credible, encouraging but results-focused, tech-savvy and forward-thinking"
);

// Update sector as business pivots
profile.updateSector("EdTech / Corporate L&D");

console.log(profile.description); // Updated description
console.log(profile.updatedAt); // Timestamp updated automatically
```

### Example 4: Linking Discovery (One-Time Only)

```typescript
import { CompanyProfileAggregate } from "@/domains/client-knowledge/aggregates";

const profile = CompanyProfileAggregate.create({
  name: "TechVenture Inc",
  sector: "FinTech",
  description: "Mobile banking solution for Gen Z and millennials",
  target: "18-35 year olds seeking mobile-first banking",
  brandTone: "Friendly, transparent, and empowering"
});

// Link discovery after onboarding
profile.linkDiscovery("discovery-abc123-xyz789");

console.log(profile.hasDiscoveryLinked()); // true
console.log(profile.discoveryId); // "discovery-abc123-xyz789"

// Try to link again - throws error (immutability invariant)
try {
  profile.linkDiscovery("discovery-different-id");
} catch (error) {
  console.error(error.message);
  // "Discovery already linked to this profile (discovery-abc123-xyz789). Cannot link again."
}
```

### Example 5: Reconstituting from Persistence

```typescript
import { CompanyProfileAggregate } from "@/domains/client-knowledge/aggregates";

// Retrieve from database
const dto = {
  id: "company-1234567890-xyz78",
  name: "Global Innovations Ltd",
  sector: "Healthcare Tech",
  description: "Telemedicine platform connecting patients with specialists worldwide",
  target: "Healthcare providers and patients in underserved regions",
  brandTone: "Compassionate, trustworthy, and innovative",
  discoveryId: "discovery-health-2024",
  createdAt: "2024-01-01T09:00:00.000Z",
  updatedAt: "2024-01-15T14:30:00.000Z"
};

// Reconstitute aggregate
const profile = CompanyProfileAggregate.fromPersisted(dto);

console.log(profile.name); // "Global Innovations Ltd"
console.log(profile.hasDiscoveryLinked()); // true
console.log(profile.discoveryId); // "discovery-health-2024"
console.log(profile.createdAt); // "2024-01-01T09:00:00.000Z"
console.log(profile.updatedAt); // "2024-01-15T14:30:00.000Z"

// No domain events raised during reconstitution
console.log(profile.getUncommittedEvents().length); // 0
```

## Use Case Integration Examples

### Example 6: RecordEpisodeUseCase

```typescript
import { RecordEpisodeUseCase } from "@/domains/memory/use-cases/record-episode";
import { EpisodicMemoryStore } from "@/data/memory/episodic-memory";

// Setup
const repository = new EpisodicMemoryStore();
const useCase = new RecordEpisodeUseCase(repository);

// Execute use case
const episode = useCase.execute({
  type: "interaction",
  description: "User requested demo of analytics dashboard",
  data: {
    feature: "analytics",
    requestType: "demo",
    urgency: "high"
  },
  tags: ["sales", "demo", "analytics"],
  importance: "high"
});

console.log(episode.id); // "ep-1234567890-abc12"
console.log(episode.metadata.importance); // "high"

// The aggregate validated the input and raised domain events
// The repository persisted the DTO
```

### Example 7: CreateProfileUseCase

```typescript
import { CreateProfileUseCase } from "@/domains/client-knowledge/use-cases/create-profile";
import { FakeCompanyProfileRepository } from "@/data/company-profile";

// Setup
const repository = new FakeCompanyProfileRepository();
const useCase = new CreateProfileUseCase(repository);

// Execute use case
const profile = useCase.execute({
  name: "NextGen Solutions",
  sector: "AI/ML",
  description: "AI-powered customer support automation platform for e-commerce",
  target: "E-commerce businesses with 100+ customer service tickets per day",
  brandTone: "Innovative, reliable, and results-oriented"
});

console.log(profile.id); // "company-1234567890-xyz78"
console.log(profile.name); // "NextGen Solutions"

// The aggregate validated all invariants before persistence
// Invalid inputs would have thrown errors before reaching the repository
```

## Domain Events Examples

### Example 8: Subscribing to Episode Events

```typescript
import { domainEventBus, EPISODE_RECORDED } from "@/domains/shared";
import { EpisodeAggregate } from "@/domains/memory/aggregates";

// Subscribe to episode recorded events
domainEventBus.subscribe(EPISODE_RECORDED, (event) => {
  console.log(`Episode recorded: ${event.payload.episodeId}`);
  console.log(`Type: ${event.payload.type}`);
  console.log(`Tags: ${event.payload.tags.join(", ")}`);
  console.log(`Importance: ${event.payload.importance}`);

  // Could trigger:
  // - Analytics tracking
  // - Notification to other modules
  // - Pattern detection
  // - Search index update
});

// Create episode (event will be raised)
const episode = EpisodeAggregate.create(
  "discovery",
  "Discovered new user behavior pattern",
  { pattern: "mobile_first_usage" },
  { tags: ["pattern", "mobile", "discovery"], importance: "high" }
);

// Publish events
const events = episode.getUncommittedEvents();
events.forEach(event => domainEventBus.publish(event));
episode.clearUncommittedEvents();

// Console output:
// "Episode recorded: ep-1234567890-abc12"
// "Type: discovery"
// "Tags: pattern, mobile, discovery"
// "Importance: high"
```

## Error Handling Examples

### Example 9: Handling Validation Errors

```typescript
import { EpisodeAggregate } from "@/domains/memory/aggregates";
import { CompanyProfileAggregate } from "@/domains/client-knowledge/aggregates";

// Episode validation error
try {
  const episode = EpisodeAggregate.create(
    "interaction",
    "", // Empty description
    {},
    { tags: ["test"] }
  );
} catch (error) {
  console.error("Validation failed:", error.message);
  // "Episode description cannot be empty"

  // Handle error appropriately
  // - Show user-friendly message
  // - Log for debugging
  // - Return error response in API
}

// Profile validation error
try {
  const profile = CompanyProfileAggregate.create({
    name: "A", // Too short
    sector: "Tech",
    description: "A tech company description",
    target: "Developers",
    brandTone: "Professional"
  });
} catch (error) {
  console.error("Profile creation failed:", error.message);
  // "Company name must be at least 2 characters long"
}

// Business rule violation
try {
  const episode = EpisodeAggregate.create(
    "task_result",
    "Task completed",
    {},
    { tags: ["task"], importance: "high" }
  );

  // Try to downgrade importance - violates invariant
  episode.upgradeImportance("medium");
} catch (error) {
  console.error("Business rule violation:", error.message);
  // "Cannot downgrade or keep same importance level. Current: high, Requested: medium"
}
```

## Best Practices

### 1. Always Use Factory Methods

```typescript
// ✅ GOOD - Use static factory method
const episode = EpisodeAggregate.create(...);

// ❌ BAD - Don't try to use constructor directly (it's private)
// const episode = new EpisodeAggregate(...); // Error!
```

### 2. Publish Events After Persistence

```typescript
// ✅ GOOD - Publish events after successful persistence
const episode = EpisodeAggregate.create(...);
const persistedEpisode = repository.save(episode.toDTO());

const events = episode.getUncommittedEvents();
events.forEach(event => domainEventBus.publish(event));
episode.clearUncommittedEvents();

// ❌ BAD - Don't publish before persistence
// Events could be published even if save fails
```

### 3. Use Domain Methods Instead of Direct Access

```typescript
const episode = EpisodeAggregate.create(...);

// ✅ GOOD - Use domain methods
episode.upgradeImportance("high");
episode.addTag("important");

// ❌ BAD - Don't try to modify internal state
// episode._importance = ...; // Error - private field!
```

### 4. Convert to DTO Only at Boundaries

```typescript
// ✅ GOOD - Work with aggregate in domain layer
const episode = EpisodeAggregate.create(...);
episode.addTag("sales");
const dto = episode.toDTO(); // Convert at persistence boundary
repository.save(dto);

// ❌ BAD - Don't convert to DTO in the middle of domain logic
// Loses type safety and business logic encapsulation
```

### 5. Handle Validation Errors Gracefully

```typescript
// ✅ GOOD - Try-catch for validation
try {
  const profile = CompanyProfileAggregate.create(input);
  return { success: true, data: profile };
} catch (error) {
  return {
    success: false,
    error: error instanceof Error ? error.message : "Unknown error"
  };
}

// ❌ BAD - Let validation errors crash the application
// const profile = CompanyProfileAggregate.create(input); // Could throw!
```

## Conclusion

These examples demonstrate:
- **Rich domain models** with encapsulated business logic
- **Invariant enforcement** at aggregate boundaries
- **Domain events** for cross-module communication
- **Immutability** for data integrity
- **Factory methods** for controlled object creation
- **DTO conversion** at persistence boundaries

Use these patterns consistently across the codebase to maintain a clean, maintainable DDD architecture.
