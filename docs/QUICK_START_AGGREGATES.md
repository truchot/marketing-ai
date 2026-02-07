# Quick Start Guide - DDD Aggregates

A developer-focused quick start guide for working with the new DDD aggregates.

---

## 5-Minute Overview

### What Changed?

**Before (Anemic Model):**
```typescript
// Just data, no behavior
const episode = {
  type: "interaction",
  description: "User feedback",
  data: {},
  tags: ["feedback"],
  importance: "high"
};
```

**After (Rich Domain Model):**
```typescript
// Business logic + validation + domain events
const episode = EpisodeAggregate.create(
  "interaction",
  "User feedback",
  {},
  { tags: ["feedback"], importance: "high" }
);

// Methods with domain meaning
episode.addTag("urgent");
episode.upgradeImportance("high");
```

---

## Import Paths

```typescript
// Aggregates
import { EpisodeAggregate } from "@/domains/memory/aggregates";
import { CompanyProfileAggregate } from "@/domains/client-knowledge/aggregates";

// Base class (usually not imported directly)
import { AggregateRoot } from "@/domains/shared";

// Domain events
import { domainEventBus, EPISODE_RECORDED } from "@/domains/shared";
```

---

## Episode Aggregate - Common Patterns

### Creating a New Episode

```typescript
import { EpisodeAggregate } from "@/domains/memory/aggregates";

const episode = EpisodeAggregate.create(
  "interaction",              // type
  "User asked about pricing", // description
  { topic: "pricing" },      // data
  {
    tags: ["sales", "pricing"],
    importance: "high"        // optional, defaults to "low"
  }
);

// Access data via getters
console.log(episode.id);              // "ep-1234567890-abc12"
console.log(episode.description);     // "User asked about pricing"
console.log(episode.tags);            // ["sales", "pricing"]
console.log(episode.importanceLevel); // "high"
```

### Loading from Database

```typescript
import { EpisodeAggregate } from "@/domains/memory/aggregates";

// Get DTO from database
const dto = await repository.findById("ep-123");

// Reconstitute aggregate
const episode = EpisodeAggregate.fromPersisted(dto);

// Now you can use domain methods
if (episode.hasTag("urgent")) {
  episode.upgradeImportance("high");
}
```

### Domain Methods

```typescript
// Add tag (with duplicate prevention)
episode.addTag("urgent");

// Upgrade importance (cannot downgrade)
episode.upgradeImportance("high"); // ✅ Works
// episode.upgradeImportance("low"); // ❌ Throws error

// Query methods
if (episode.hasTag("sales")) {
  console.log("Sales episode");
}

if (episode.hasAllTags(["sales", "urgent"])) {
  console.log("Urgent sales episode");
}

if (episode.isMoreImportantThan("medium")) {
  console.log("High priority");
}
```

### Saving to Database

```typescript
// Convert to DTO for persistence
const dto = episode.toDTO();

// Save via repository
await repository.save(dto);
```

---

## CompanyProfile Aggregate - Common Patterns

### Creating a New Profile

```typescript
import { CompanyProfileAggregate } from "@/domains/client-knowledge/aggregates";

const profile = CompanyProfileAggregate.create({
  name: "Acme Corporation",
  sector: "SaaS B2B",
  description: "Cloud-based project management platform",
  target: "Marketing directors in mid-size companies",
  brandTone: "Professional yet approachable"
});

console.log(profile.id);   // "company-1234567890-xyz78"
console.log(profile.name); // "Acme Corporation"
```

### Updating Profile Fields

```typescript
// All update methods validate input
profile.updateDescription("New description for the company");
profile.updateName("New Acme Corp");
profile.updateSector("FinTech");
profile.updateTarget("CTOs and CFOs");
profile.updateBrandTone("Data-driven and innovative");

// updatedAt timestamp is automatically managed
console.log(profile.updatedAt); // Latest update time
```

### Linking Discovery (One-Time Only)

```typescript
// Link discovery after onboarding
profile.linkDiscovery("discovery-abc123");

// Check if linked
if (profile.hasDiscoveryLinked()) {
  console.log(`Discovery ID: ${profile.discoveryId}`);
}

// Try to link again - throws error
// profile.linkDiscovery("another-id"); // ❌ Error!
```

### Loading from Database

```typescript
import { CompanyProfileAggregate } from "@/domains/client-knowledge/aggregates";

const dto = await repository.get();
const profile = CompanyProfileAggregate.fromPersisted(dto);

// Use domain methods
profile.updateBrandTone("Modern and approachable");
```

---

## Use Case Integration

### Pattern: Create → Publish Events → Persist

```typescript
import { EpisodeAggregate } from "@/domains/memory/aggregates";
import { domainEventBus } from "@/domains/shared";

export class RecordEpisodeUseCase {
  execute(input) {
    // 1. Create aggregate (validates invariants)
    const aggregate = EpisodeAggregate.create(
      input.type,
      input.description,
      input.data,
      { tags: input.tags, importance: input.importance }
    );

    // 2. Publish domain events
    const events = aggregate.getUncommittedEvents();
    events.forEach(event => domainEventBus.publish(event));
    aggregate.clearUncommittedEvents();

    // 3. Persist via repository
    return this.repository.recordEpisode(
      aggregate.type,
      aggregate.description,
      aggregate.data,
      { tags: aggregate.tags, importance: aggregate.importanceLevel }
    );
  }
}
```

---

## Error Handling

### Validation Errors

```typescript
try {
  // Empty description - throws error
  const episode = EpisodeAggregate.create(
    "interaction",
    "",  // ❌ Empty
    {},
    { tags: ["test"] }
  );
} catch (error) {
  console.error(error.message); // "Episode description cannot be empty"
  // Handle error appropriately
}
```

### Business Rule Violations

```typescript
try {
  const episode = EpisodeAggregate.create(...);

  // Try to downgrade importance - violates invariant
  episode.upgradeImportance("low"); // ❌ Error
} catch (error) {
  console.error(error.message);
  // "Cannot downgrade or keep same importance level"
}
```

### Recommended Pattern

```typescript
function createEpisode(input) {
  try {
    const episode = EpisodeAggregate.create(
      input.type,
      input.description,
      input.data,
      { tags: input.tags, importance: input.importance }
    );
    return { success: true, data: episode };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
```

---

## Domain Events

### Subscribing to Events

```typescript
import { domainEventBus, EPISODE_RECORDED } from "@/domains/shared";

// Subscribe once at application startup
domainEventBus.subscribe(EPISODE_RECORDED, (event) => {
  console.log("Episode recorded:", event.payload.episodeId);

  // Trigger side effects:
  // - Update analytics
  // - Send notifications
  // - Update search index
  // - Detect patterns
});
```

### Publishing Events

```typescript
// Events are published by use cases after persistence
const aggregate = EpisodeAggregate.create(...);

// Get uncommitted events
const events = aggregate.getUncommittedEvents();

// Publish to event bus
events.forEach(event => domainEventBus.publish(event));

// Clear after publishing
aggregate.clearUncommittedEvents();
```

---

## Testing

### Unit Testing Aggregates

```typescript
import { describe, it, expect } from "vitest";
import { EpisodeAggregate } from "@/domains/memory/aggregates";

describe("EpisodeAggregate", () => {
  it("should create episode with valid data", () => {
    const episode = EpisodeAggregate.create(
      "interaction",
      "User feedback",
      {},
      { tags: ["feedback"] }
    );

    expect(episode.description).toBe("User feedback");
    expect(episode.tags).toEqual(["feedback"]);
  });

  it("should reject empty description", () => {
    expect(() =>
      EpisodeAggregate.create("interaction", "", {}, { tags: ["test"] })
    ).toThrow("Episode description cannot be empty");
  });
});
```

### Integration Testing with Use Cases

```typescript
import { RecordEpisodeUseCase } from "@/domains/memory/use-cases/record-episode";
import { EpisodicMemoryStore } from "@/data/memory/episodic-memory";

describe("RecordEpisodeUseCase", () => {
  it("should record episode via use case", () => {
    const repository = new EpisodicMemoryStore();
    const useCase = new RecordEpisodeUseCase(repository);

    const result = useCase.execute({
      type: "interaction",
      description: "User asked about pricing",
      data: {},
      tags: ["sales"],
      importance: "high"
    });

    expect(result.id).toBeDefined();
    expect(result.description).toBe("User asked about pricing");
  });
});
```

---

## Common Pitfalls

### ❌ Don't: Try to modify internal state directly

```typescript
// ❌ BAD - Fields are private
episode._description = "New description"; // Error!

// ✅ GOOD - Use domain methods (if applicable)
// Episode description is immutable, so no update method
```

### ❌ Don't: Convert to DTO in domain logic

```typescript
// ❌ BAD - Stay in domain layer
const dto = episode.toDTO();
processDto(dto);

// ✅ GOOD - Work with aggregate
processEpisode(episode);
```

### ❌ Don't: Publish events before persistence

```typescript
// ❌ BAD - Events published even if save fails
const aggregate = EpisodeAggregate.create(...);
domainEventBus.publish(aggregate.getUncommittedEvents()[0]);
repository.save(aggregate.toDTO()); // Could fail!

// ✅ GOOD - Publish after successful save
const aggregate = EpisodeAggregate.create(...);
repository.save(aggregate.toDTO());
const events = aggregate.getUncommittedEvents();
events.forEach(event => domainEventBus.publish(event));
```

### ❌ Don't: Use constructor directly

```typescript
// ❌ BAD - Constructor is private
const episode = new EpisodeAggregate(...); // Error!

// ✅ GOOD - Use factory methods
const episode = EpisodeAggregate.create(...);
const episode2 = EpisodeAggregate.fromPersisted(dto);
```

---

## Best Practices

### ✅ Always validate early

```typescript
// Validation happens in aggregate constructor
const profile = CompanyProfileAggregate.create(input);
// If we reach here, input is valid
```

### ✅ Use domain methods with clear names

```typescript
// ✅ GOOD - Clear domain meaning
episode.upgradeImportance("high");
profile.linkDiscovery(id);

// ❌ BAD - Generic setters (not provided)
// episode.setImportance("high");
// profile.setDiscoveryId(id);
```

### ✅ Convert to DTO only at boundaries

```typescript
// ✅ GOOD - Work with aggregate in domain
const episode = EpisodeAggregate.create(...);
episode.addTag("urgent");

// Convert at persistence boundary
const dto = episode.toDTO();
await repository.save(dto);
```

### ✅ Handle errors gracefully

```typescript
try {
  const profile = CompanyProfileAggregate.create(input);
  // Process successfully
} catch (error) {
  // Handle validation error
  logger.error("Profile creation failed", error);
  return errorResponse(error.message);
}
```

---

## Cheat Sheet

### Episode Aggregate

```typescript
// Create
EpisodeAggregate.create(type, description, data, { tags, importance })

// Load from DB
EpisodeAggregate.fromPersisted(dto)

// Methods
episode.addTag(tag)
episode.upgradeImportance(level)
episode.hasTag(tag)
episode.hasAllTags(tags)
episode.isMoreImportantThan(level)
episode.toDTO()

// Getters
episode.id
episode.type
episode.description
episode.data
episode.tags
episode.importanceLevel
episode.timestamp
```

### CompanyProfile Aggregate

```typescript
// Create
CompanyProfileAggregate.create({ name, sector, description, target, brandTone })

// Load from DB
CompanyProfileAggregate.fromPersisted(dto)

// Methods
profile.updateDescription(text)
profile.updateName(name)
profile.updateSector(sector)
profile.updateTarget(target)
profile.updateBrandTone(tone)
profile.linkDiscovery(id)
profile.hasDiscoveryLinked()
profile.toDTO()

// Getters
profile.id
profile.name
profile.sector
profile.description
profile.target
profile.brandTone
profile.discoveryId
profile.createdAt
profile.updatedAt
```

---

## Need More?

- **Full Design Documentation:** `/Users/florian/Sites/marketing-ai/docs/ddd-aggregates-design.md`
- **Usage Examples:** `/Users/florian/Sites/marketing-ai/docs/ddd-aggregates-examples.md`
- **Architecture Diagrams:** `/Users/florian/Sites/marketing-ai/docs/ddd-aggregates-diagrams.md`
- **Implementation Summary:** `/Users/florian/Sites/marketing-ai/docs/IMPLEMENTATION_SUMMARY.md`
- **Unit Tests:** `/Users/florian/Sites/marketing-ai/src/__tests__/aggregates/`

---

## Questions?

Common questions and answers:

**Q: Can I modify episode data after creation?**
A: No, episode data is immutable. This preserves historical accuracy.

**Q: Can I downgrade episode importance?**
A: No, importance can only be upgraded. This maintains historical importance decisions.

**Q: Can I link multiple discoveries to a profile?**
A: No, discovery can only be linked once. This enforces a one-to-one relationship.

**Q: Why use aggregates instead of plain objects?**
A: Aggregates encapsulate business logic, enforce invariants, and prevent invalid states.

**Q: Do I need to publish domain events?**
A: Yes, if you want other parts of the system to react to changes. Use cases handle this.

**Q: What happens if validation fails?**
A: Aggregates throw descriptive errors. Wrap in try-catch and handle appropriately.
