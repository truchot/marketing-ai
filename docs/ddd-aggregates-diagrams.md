# DDD Aggregates - Architecture Diagrams

## 1. Aggregate Structure Overview

```mermaid
classDiagram
    class AggregateRoot {
        <<abstract>>
        -uncommittedEvents: DomainEvent[]
        #addDomainEvent(event)
        +getUncommittedEvents()
        +clearUncommittedEvents()
    }

    class EpisodeAggregate {
        -_id: MemoryId
        -_type: EpisodeType
        -_description: string
        -_data: Record
        -_tags: Tag[]
        -_importance: Importance
        -_timestamp: Timestamp
        +create() EpisodeAggregate$
        +fromPersisted(dto) EpisodeAggregate$
        +addTag(tagValue)
        +upgradeImportance(level)
        +hasTag(tagValue) boolean
        +hasAllTags(tags) boolean
        +isMoreImportantThan(level) boolean
        +toDTO() Episode
    }

    class CompanyProfileAggregate {
        -_id: MemoryId
        -_name: string
        -_sector: string
        -_description: string
        -_target: string
        -_brandTone: string
        -_discoveryId: string
        -_createdAt: Timestamp
        -_updatedAt: Timestamp
        +create(data) CompanyProfileAggregate$
        +fromPersisted(dto) CompanyProfileAggregate$
        +updateDescription(text)
        +updateName(name)
        +updateSector(sector)
        +updateTarget(target)
        +updateBrandTone(tone)
        +linkDiscovery(id)
        +hasDiscoveryLinked() boolean
        +toDTO() CompanyProfile
    }

    AggregateRoot <|-- EpisodeAggregate
    AggregateRoot <|-- CompanyProfileAggregate
```

## 2. Episode Aggregate with Value Objects

```mermaid
classDiagram
    class EpisodeAggregate {
        -_id: MemoryId
        -_type: EpisodeType
        -_description: string
        -_data: Record
        -_tags: Tag[]
        -_importance: Importance
        -_timestamp: Timestamp
    }

    class MemoryId {
        +value: string
        +create(value) MemoryId$
        +equals(other) boolean
        +toString() string
    }

    class Tag {
        +value: string
        +create(value) Tag$
        +equals(other) boolean
        +toString() string
    }

    class Importance {
        +value: "low"|"medium"|"high"
        +create(value) Importance$
        +isHigherThan(other) boolean
        +isAtLeast(other) boolean
        +equals(other) boolean
    }

    class Timestamp {
        +value: string
        +create(isoString) Timestamp$
        +now() Timestamp$
        +isBefore(other) boolean
        +isAfter(other) boolean
        +toDate() Date
    }

    EpisodeAggregate o-- MemoryId : id
    EpisodeAggregate o-- Tag : tags *
    EpisodeAggregate o-- Importance : importance
    EpisodeAggregate o-- Timestamp : timestamp
```

## 3. CompanyProfile Aggregate Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created: create()

    Created --> WithDiscovery: linkDiscovery()
    Created --> Updated: update methods

    Updated --> Updated: update methods
    Updated --> WithDiscovery: linkDiscovery()

    WithDiscovery --> WithDiscovery: update methods

    note right of WithDiscovery
        Discovery link is immutable
        Cannot be changed once set
    end note

    note left of Created
        All fields validated
        on creation
    end note
```

## 4. Episode Importance Upgrade Flow

```mermaid
stateDiagram-v2
    [*] --> Low: create(importance: "low")
    [*] --> Medium: create(importance: "medium")
    [*] --> High: create(importance: "high")

    Low --> Medium: upgradeImportance("medium")
    Low --> High: upgradeImportance("high")

    Medium --> High: upgradeImportance("high")

    Low --> Low: ❌ Cannot downgrade
    Medium --> Low: ❌ Cannot downgrade
    High --> Medium: ❌ Cannot downgrade
    High --> Low: ❌ Cannot downgrade

    note right of High
        Importance can only increase
        Never decrease (invariant)
    end note
```

## 5. Domain Event Flow

```mermaid
sequenceDiagram
    participant UC as Use Case
    participant A as Aggregate
    participant EB as Event Bus
    participant R as Repository
    participant H as Event Handler

    UC->>A: create(data)
    activate A
    A->>A: Validate invariants
    A->>A: addDomainEvent(EPISODE_RECORDED)
    A-->>UC: aggregate
    deactivate A

    UC->>A: getUncommittedEvents()
    A-->>UC: events[]

    UC->>R: save(aggregate.toDTO())
    R-->>UC: persisted DTO

    loop For each event
        UC->>EB: publish(event)
        EB->>H: handle(event)
        activate H
        H->>H: Process event
        deactivate H
    end

    UC->>A: clearUncommittedEvents()
```

## 6. Use Case to Repository Flow

```mermaid
sequenceDiagram
    participant Client
    participant UC as RecordEpisodeUseCase
    participant A as EpisodeAggregate
    participant R as EpisodicMemoryRepository
    participant EB as EventBus

    Client->>UC: execute(input)
    activate UC

    UC->>A: create(type, description, data, options)
    activate A
    A->>A: Validate description not empty
    A->>A: Validate at least one tag
    A->>A: Create value objects
    A->>A: addDomainEvent(EPISODE_RECORDED)
    A-->>UC: aggregate
    deactivate A

    UC->>A: getUncommittedEvents()
    A-->>UC: events[]

    UC->>EB: publish(events)
    activate EB
    EB->>EB: Notify handlers
    deactivate EB

    UC->>A: clearUncommittedEvents()

    UC->>R: recordEpisode(type, desc, data, metadata)
    activate R
    R->>R: Persist DTO
    R-->>UC: Episode DTO
    deactivate R

    UC-->>Client: Episode DTO
    deactivate UC
```

## 7. Aggregate Boundary and Repository Pattern

```mermaid
graph TB
    subgraph "Domain Layer"
        A1[EpisodeAggregate]
        A2[CompanyProfileAggregate]
        VO1[MemoryId]
        VO2[Tag]
        VO3[Importance]
        VO4[Timestamp]

        A1 -.uses.-> VO1
        A1 -.uses.-> VO2
        A1 -.uses.-> VO3
        A1 -.uses.-> VO4

        A2 -.uses.-> VO1
        A2 -.uses.-> VO4
    end

    subgraph "Application Layer"
        UC1[RecordEpisodeUseCase]
        UC2[CreateProfileUseCase]
    end

    subgraph "Infrastructure Layer"
        R1[EpisodicMemoryStore]
        R2[CompanyProfileStore]
    end

    UC1 -->|creates| A1
    UC1 -->|calls| R1

    UC2 -->|creates| A2
    UC2 -->|calls| R2

    R1 -.persists.-> DTO1[Episode DTO]
    R2 -.persists.-> DTO2[CompanyProfile DTO]

    A1 -.toDTO.-> DTO1
    A2 -.toDTO.-> DTO2
```

## 8. Validation Chain

```mermaid
graph TD
    Start[Client Request] --> UC[Use Case]

    UC --> Create[Aggregate.create]

    Create --> V1{Description<br/>not empty?}
    V1 -->|No| E1[Throw Error]
    V1 -->|Yes| V2{Has at least<br/>one tag?}

    V2 -->|No| E2[Throw Error]
    V2 -->|Yes| V3{Valid<br/>importance?}

    V3 -->|No| E3[Throw Error]
    V3 -->|Yes| V4{All tags<br/>valid?}

    V4 -->|No| E4[Throw Error]
    V4 -->|Yes| Success[Create Aggregate]

    Success --> Event[Raise Domain Event]
    Event --> Return[Return to Use Case]

    E1 --> Error[Error Response]
    E2 --> Error
    E3 --> Error
    E4 --> Error

    Return --> Persist[Persist via Repository]
    Persist --> Response[Success Response]
```

## 9. Aggregate Encapsulation

```mermaid
graph LR
    subgraph "Public API (Tell-Don't-Ask)"
        M1[create]
        M2[addTag]
        M3[upgradeImportance]
        M4[hasTag]
        M5[toDTO]
    end

    subgraph "Private State"
        S1[_id]
        S2[_description]
        S3[_tags]
        S4[_importance]
        S5[_data]
    end

    subgraph "Invariants"
        I1[Description not empty]
        I2[At least one tag]
        I3[No duplicate tags]
        I4[Importance only increases]
    end

    M2 -.enforces.-> I3
    M3 -.enforces.-> I4
    M1 -.enforces.-> I1
    M1 -.enforces.-> I2

    M2 -->|modifies| S3
    M3 -->|modifies| S4

    style S1 fill:#f9f9f9
    style S2 fill:#f9f9f9
    style S3 fill:#f9f9f9
    style S4 fill:#f9f9f9
    style S5 fill:#f9f9f9

    style I1 fill:#ffe6e6
    style I2 fill:#ffe6e6
    style I3 fill:#ffe6e6
    style I4 fill:#ffe6e6
```

## 10. Migration Path: Anemic to Rich

```mermaid
graph TB
    subgraph "Phase 1: Current (Backward Compatible)"
        UC1[Use Case]
        AGG1[Aggregate<br/>Validation + Logic]
        DTO1[Episode DTO]
        REPO1[Repository<br/>accepts DTO]

        UC1 -->|creates| AGG1
        AGG1 -->|toDTO| DTO1
        UC1 -->|saves| REPO1
        DTO1 --> REPO1
    end

    subgraph "Phase 2: Future (Aggregate-First)"
        UC2[Use Case]
        AGG2[Aggregate<br/>Full Domain Model]
        REPO2[Repository<br/>accepts Aggregate]

        UC2 -->|creates| AGG2
        UC2 -->|saves| REPO2
        AGG2 --> REPO2
    end

    Phase1 -.evolves to.-> Phase2

    style AGG1 fill:#fff4e6
    style AGG2 fill:#e6ffe6
```

## 11. Domain Events Timeline

```mermaid
sequenceDiagram
    autonumber

    participant A as Aggregate
    participant UC as Use Case
    participant R as Repository
    participant EB as Event Bus
    participant H1 as Pattern Detector
    participant H2 as Analytics

    Note over A: Episode created
    A->>A: addDomainEvent(EPISODE_RECORDED)

    A->>UC: Return aggregate
    UC->>A: getUncommittedEvents()
    A->>UC: [EPISODE_RECORDED]

    UC->>R: save(DTO)
    R->>UC: persisted DTO

    Note over UC,EB: Publish only after<br/>successful persistence

    UC->>EB: publish(EPISODE_RECORDED)

    par Parallel Event Handling
        EB->>H1: EPISODE_RECORDED
        H1->>H1: Detect patterns
    and
        EB->>H2: EPISODE_RECORDED
        H2->>H2: Update analytics
    end

    UC->>A: clearUncommittedEvents()
```

## 12. Aggregate Size Metrics

```mermaid
graph LR
    subgraph "Small Aggregate ✅"
        E[EpisodeAggregate]
        E1[9 methods]
        E2[4 invariants]
        E3[0 child entities]
        E4[5 value objects]

        E --> E1
        E --> E2
        E --> E3
        E --> E4
    end

    subgraph "Medium Aggregate ✅"
        C[CompanyProfileAggregate]
        C1[11 methods]
        C2[6 invariants]
        C3[0 child entities]
        C4[2 value objects]

        C --> C1
        C --> C2
        C --> C3
        C --> C4
    end

    style E fill:#e6ffe6
    style C fill:#e6ffe6

    Note1[Both aggregates are well-sized<br/>No child entities = simple boundaries<br/>Transaction scope = aggregate root]
```

## Design Principles Visualization

### Principle 1: Encapsulation
```mermaid
graph LR
    A[External Code] -->|Can only call| B[Public Methods]
    B -->|Modify| C[Private State]
    C -->|Protected by| D[Invariants]

    A -.cannot access.-> C

    style C fill:#f9f9f9
    style D fill:#ffe6e6
```

### Principle 2: Immutability
```mermaid
graph TB
    A[Episode Data] -->|Frozen| B[Cannot Modify]
    C[Episode Tags] -->|ReadonlyArray| D[Cannot Push/Pop]
    E[Value Objects] -->|Immutable| F[Replacement Only]

    style B fill:#ffe6e6
    style D fill:#ffe6e6
    style F fill:#ffe6e6
```

### Principle 3: Tell-Don't-Ask
```mermaid
graph LR
    G[✅ Good:<br/>episode.upgradeImportance("high")]
    B[❌ Bad:<br/>episode.setImportance("high")]

    G2[✅ Good:<br/>profile.linkDiscovery(id)]
    B2[❌ Bad:<br/>profile.setDiscoveryId(id)]

    style G fill:#e6ffe6
    style B fill:#ffe6e6
    style G2 fill:#e6ffe6
    style B2 fill:#ffe6e6
```

## Conclusion

These diagrams illustrate:
- **Aggregate structure** and inheritance hierarchy
- **Value object composition** within aggregates
- **State transitions** and lifecycle management
- **Domain event flow** from creation to handling
- **Validation chains** ensuring invariants
- **Encapsulation boundaries** protecting internal state
- **Migration path** from anemic to rich models
- **Design principles** in practice

Use these diagrams for:
- Onboarding new developers
- Architecture documentation
- Design discussions
- Code review reference
