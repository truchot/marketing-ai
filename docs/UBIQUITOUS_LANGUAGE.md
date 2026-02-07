# Glossaire d'Ubiquitous Language -- Marketing AI

> **Derniere mise a jour** : 2026-02-07
> **Convention** : Les termes metier sont en anglais (langue du code), les definitions et explications sont en francais.

---

## Table des matieres

1. [Memory Context](#1-memory-context)
2. [Conversation Context](#2-conversation-context)
3. [Client Knowledge Context](#3-client-knowledge-context)
4. [Onboarding Context](#4-onboarding-context)
5. [Shared Kernel](#5-shared-kernel)
6. [Incoherences et recommandations](#6-incoherences-et-recommandations)

---

## 1. Memory Context

Le contexte Memory est le coeur du systeme. Il s'inspire du modele de memoire humaine a trois niveaux : memoire de travail (court terme), memoire episodique (moyen terme), memoire semantique (long terme).

### 1.1. WorkingMemory / WorkingSession

| Attribut | Detail |
|----------|--------|
| **Nom** | WorkingMemory / WorkingSession |
| **Definition** | Memoire de travail a court terme. Represente la session de travail en cours : la tache active, son objectif, les resultats intermediaires et le focus d'attention. Une seule session peut exister a la fois. |
| **Contexte** | Memory Context |
| **Invariants** | Il ne peut y avoir qu'une seule session active. Demarrer une nouvelle session ecrase implicitement la precedente. La session contient un scratchpad (notes temporaires) et des resultats intermediaires (donnees arbitraires). |
| **Relations** | Lors de la consolidation, une WorkingSession terminee est transformee en Episode de type `"task_result"`. |
| **Fichiers** | `src/types/memory.ts` (WorkingSession, WorkingContext), `src/domains/memory/ports/working-memory-repository.ts`, `src/data/memory/working-memory.ts` |

### 1.2. Episode

| Attribut | Detail |
|----------|--------|
| **Nom** | Episode |
| **Definition** | Unite atomique de la memoire episodique. Represente un evenement significatif survenu dans le systeme : une interaction utilisateur, un resultat de tache, un feedback, ou une etape de decouverte. Chaque episode est horodate, categorise par type et annote avec des tags et un niveau d'importance. |
| **Contexte** | Memory Context |
| **Invariants** | Possede un `id` unique (prefixe `ep-`). Le `type` est contraint a `"interaction" | "task_result" | "feedback" | "discovery"`. Le champ `metadata.importance` doit etre `"low" | "medium" | "high"`. Les `tags` sont des chaines non vides. |
| **Relations** | Enregistre par `RecordEpisodeUseCase`. Aggrege dans `EpisodicContext`. Peut contribuer a la detection d'un `EmergentPattern`. Prune apres 30 jours par le `ConsolidationPipeline`. |
| **Fichiers** | `src/types/memory.ts` (Episode, EpisodeType), `src/domains/memory/use-cases/record-episode.ts` |

### 1.3. EpisodicMemory (store) / EpisodicContext (projection)

| Attribut | Detail |
|----------|--------|
| **Nom** | EpisodicMemory (store) / EpisodicContext (projection en lecture) |
| **Definition** | `EpisodicMemory` est le store qui gere la collection d'episodes, de feedbacks, de resultats de taches et de patterns emergents. `EpisodicContext` est la projection en lecture qui filtre ces donnees par fenetre de retention (30 jours par defaut). |
| **Contexte** | Memory Context |
| **Invariants** | Le contexte episodique ne retourne que les elements dans la fenetre de retention. La detection de patterns se fait automatiquement a chaque enregistrement d'episode. |
| **Relations** | Contient des `Episode[]`, `Feedback[]`, `TaskResult[]`, `EmergentPattern[]`. Consomme par `MemoryQueryService` et `ConsolidationPipeline`. |
| **Fichiers** | `src/types/memory.ts` (EpisodicContext), `src/domains/memory/ports/episodic-memory-repository.ts`, `src/data/memory/episodic-memory.ts` |

### 1.4. Feedback

| Attribut | Detail |
|----------|--------|
| **Nom** | Feedback |
| **Definition** | Retour explicite d'un utilisateur ou du systeme sur une action ou un resultat. Caracterise par une source, un sentiment (positif, neutre, negatif) et un contenu textuel. Optionnellement lie a une tache via `taskId`. |
| **Contexte** | Memory Context |
| **Invariants** | Le `sentiment` est contraint a `"positive" | "neutral" | "negative"`. L'id est prefixe `fb-`. |
| **Relations** | Enregistre par `RecordFeedbackUseCase`. Lors de la consolidation, les feedbacks recurrents (>= 3 occurrences du meme sentiment+contenu) sont promus en `Preference` dans la memoire semantique. |
| **Fichiers** | `src/types/memory.ts` (Feedback, FeedbackSentiment), `src/domains/memory/use-cases/record-feedback.ts` |

### 1.5. EmergentPattern

| Attribut | Detail |
|----------|--------|
| **Nom** | EmergentPattern |
| **Definition** | Pattern detecte automatiquement dans la memoire episodique. Represente une regularite observee : un meme type d'episode avec les memes tags qui se repete. Le pattern emerge de l'observation, il n'est pas declare manuellement. |
| **Contexte** | Memory Context |
| **Invariants** | La cle du pattern est `"${episode.type}:${sorted_tags}"`. Le compteur `occurrences` s'incremente a chaque nouvelle observation. Les dates `firstSeen` et `lastSeen` encadrent la periode d'observation. L'id est prefixe `emrg-`. |
| **Relations** | Detecte automatiquement par `EpisodicMemoryStore.detectPattern()`. Promu en `ValidatedPattern` par le `ConsolidationPipeline` quand `occurrences >= 3` (seuil `PATTERN_PROMOTION_THRESHOLD`). |
| **Fichiers** | `src/types/memory.ts` (EmergentPattern), `src/data/memory/episodic-memory.ts` (detectPattern) |

### 1.6. ValidatedPattern

| Attribut | Detail |
|----------|--------|
| **Nom** | ValidatedPattern |
| **Definition** | Pattern qui a ete confirme et promu dans la memoire semantique (long terme). Contrairement a l'EmergentPattern (observation brute), le ValidatedPattern inclut un trigger (ce qui le declenche), un outcome (ce qui en resulte) et une recommendation (comment agir). |
| **Contexte** | Memory Context (memoire semantique) |
| **Invariants** | L'id est prefixe `pat-`. Le champ `validatedAt` est la date de promotion. Un pattern du meme `type` ne peut pas etre promu deux fois (deduplication dans le ConsolidationPipeline). |
| **Relations** | Cree par `AddValidatedPatternUseCase` ou par promotion automatique via `ConsolidationPipeline.consolidateEpisodicToSemantic()`. Consulte par `MemoryQueryService`. |
| **Fichiers** | `src/types/memory.ts` (ValidatedPattern), `src/domains/memory/use-cases/add-validated-pattern.ts`, `src/domains/memory/services/consolidation-pipeline.ts` |

### 1.7. ClientFact

| Attribut | Detail |
|----------|--------|
| **Nom** | ClientFact |
| **Definition** | Fait objectif et verifie concernant le client, stocke dans la memoire semantique. Organise par categorie (company, market, problem, audience, marketing, business, strategy, etc.) avec indication de la source. |
| **Contexte** | Memory Context (memoire semantique) |
| **Invariants** | L'id est prefixe `fact-`. Chaque fait a une categorie, un contenu textuel et une source d'origine. La publication de l'evenement `CLIENT_FACT_ADDED` est garantie apres chaque ajout. |
| **Relations** | Cree par `AddClientFactUseCase`. Massivement alimente par `CompleteOnboardingUseCase` (contexte Onboarding) et par le tool `saveDiscoveryBlock` (agent Discovery). Consulte par `MemoryQueryService`. |
| **Fichiers** | `src/types/memory.ts` (ClientFact), `src/domains/memory/use-cases/add-client-fact.ts` |

### 1.8. Preference

| Attribut | Detail |
|----------|--------|
| **Nom** | Preference |
| **Definition** | Preference du client detectee ou declaree, avec un niveau de confiance. Represente les gouts, habitudes ou attentes du client en matiere de marketing (ton, format, canal prefere, etc.). |
| **Contexte** | Memory Context (memoire semantique) |
| **Invariants** | L'id est prefixe `pref-`. Une preference est identifiee de maniere unique par le couple `(category, key)`. Si une preference existante a le meme couple, elle est mise a jour (upsert). Le `confidence` doit etre un `ConfidenceLevel` valide. L'evenement `PREFERENCE_UPDATED` est publie apres chaque ajout/mise a jour. |
| **Relations** | Creee par `AddPreferenceUseCase`. Peut aussi etre creee par promotion de feedbacks recurrents via `ConsolidationPipeline`. Validee par le Value Object `ConfidenceLevel`. |
| **Fichiers** | `src/types/memory.ts` (Preference), `src/domains/memory/use-cases/add-preference.ts`, `src/data/memory/semantic-memory.ts` (logique d'upsert) |

### 1.9. LearnedRule

| Attribut | Detail |
|----------|--------|
| **Nom** | LearnedRule |
| **Definition** | Regle metier apprise par le systeme dans un domaine specifique. Associe une description (quand appliquer), un domaine (dans quel contexte), une action (que faire) et un niveau de confiance. |
| **Contexte** | Memory Context (memoire semantique) |
| **Invariants** | L'id est prefixe `rule-`. Le `confidence` doit etre un `ConfidenceLevel` valide. |
| **Relations** | Creee par `AddLearnedRuleUseCase`. Consultee par `MemoryQueryService.getContextForTask()` avec filtrage par domaine. |
| **Fichiers** | `src/types/memory.ts` (LearnedRule), `src/domains/memory/use-cases/add-learned-rule.ts` |

### 1.10. Consolidation / ConsolidationPipeline

| Attribut | Detail |
|----------|--------|
| **Nom** | Consolidation / ConsolidationPipeline |
| **Definition** | Processus periodique qui fait "monter" les connaissances du court terme vers le long terme, par analogie avec la consolidation de la memoire humaine pendant le sommeil. Trois etapes : Working -> Episodic (sauvegarde de session), Episodic -> Semantic (promotion de patterns et feedbacks recurrents), pruning (suppression des episodes obsoletes). |
| **Contexte** | Memory Context |
| **Invariants** | Seuil de promotion des patterns : `PATTERN_PROMOTION_THRESHOLD = 3` occurrences. Retention episodique : `EPISODIC_RETENTION_DAYS = 30` jours. La deduplication empeche la double promotion d'un meme pattern. |
| **Relations** | Orchestre les trois repositories (Working, Episodic, Semantic). Declenche par `ConsolidateMemoryUseCase`. Expose via `POST /api/memory/consolidate`. |
| **Fichiers** | `src/domains/memory/services/consolidation-pipeline.ts`, `src/domains/memory/use-cases/consolidate-memory.ts` |

### 1.11. PatternPromotion

| Attribut | Detail |
|----------|--------|
| **Nom** | PatternPromotion (concept, pas un type explicite) |
| **Definition** | Le processus par lequel un `EmergentPattern` (observation brute dans la memoire episodique) devient un `ValidatedPattern` (connaissance confirmee dans la memoire semantique). La promotion se produit quand le pattern a ete observe au moins 3 fois. |
| **Contexte** | Memory Context |
| **Invariants** | `occurrences >= PATTERN_PROMOTION_THRESHOLD (3)`. Un pattern deja promu (meme `type`) ne sera pas re-promu. |
| **Relations** | Lie `EmergentPattern` a `ValidatedPattern`. Execute par `ConsolidationPipeline.consolidateEpisodicToSemantic()`. |
| **Fichiers** | `src/domains/memory/services/consolidation-pipeline.ts` (lignes 43-59) |

### 1.12. TaskResult

| Attribut | Detail |
|----------|--------|
| **Nom** | TaskResult |
| **Definition** | Resultat d'une tache executee par le systeme. Capture l'identifiant de la tache, sa description, son issue (succes, partiel, echec) et des donnees de contexte. |
| **Contexte** | Memory Context (memoire episodique) |
| **Invariants** | L'id est prefixe `tr-`. Le `outcome` est contraint a `"success" | "partial" | "failure"`. |
| **Relations** | Enregistre par `IEpisodicMemoryRepository.recordTaskResult()`. Inclus dans `EpisodicContext`. Un `Feedback` peut etre lie a un `TaskResult` via le champ `taskId`. |
| **Fichiers** | `src/types/memory.ts` (TaskResult), `src/domains/memory/ports/episodic-memory-repository.ts` |

### 1.13. MemoryQueryService

| Attribut | Detail |
|----------|--------|
| **Nom** | MemoryQueryService |
| **Definition** | Service domaine qui fournit une interface de requete unifiee sur les trois couches de memoire. Permet de filtrer par type de memoire, par tags, par categorie et par limite. Fournit aussi un contexte de tache (`TaskContext`) et un contexte complet en texte (`getFullContext()`). |
| **Contexte** | Memory Context |
| **Invariants** | Par defaut, interroge les trois couches. Le filtrage par tags ne s'applique qu'aux episodes. Le filtrage par categorie s'applique a tous les elements semantiques. |
| **Relations** | Consomme les trois repositories. Utilise par `QueryMemoryUseCase` et `ConsolidateMemoryUseCase`. |
| **Fichiers** | `src/domains/memory/services/memory-query-service.ts` |

### 1.14. SearchResult / MemoryStats

| Attribut | Detail |
|----------|--------|
| **Nom** | SearchResult / MemoryStats |
| **Definition** | `SearchResult` est la projection combinee des trois couches de memoire, retournee par une requete. `MemoryStats` est un resume quantitatif (nombre d'episodes, de faits, de patterns, etc.) |
| **Contexte** | Memory Context |
| **Relations** | Produit par `MemoryQueryService`. Retourne par `QueryMemoryUseCase`. |
| **Fichiers** | `src/types/memory.ts` (SearchResult, MemoryStats) |

---

## 2. Conversation Context

### 2.1. ConversationMessage

| Attribut | Detail |
|----------|--------|
| **Nom** | ConversationMessage |
| **Definition** | Message unitaire dans une conversation entre l'utilisateur et l'assistant. Caracterise par un role (utilisateur ou assistant), un contenu textuel et un horodatage de creation. |
| **Contexte** | Conversation Context |
| **Invariants** | Le `role` est contraint a `"user" | "assistant"`. L'id est genere automatiquement. Le `createdAt` est un ISO timestamp. |
| **Relations** | Stocke et recupere par `IConversationRepository`. Cree par `SendMessageUseCase` (un message user + un message assistant par invocation). |
| **Fichiers** | `src/types/index.ts` (ConversationMessage), `src/domains/conversation/ports/conversation-repository.ts` |

### 2.2. ConversationHistory (concept implicite)

| Attribut | Detail |
|----------|--------|
| **Nom** | ConversationHistory (concept, pas un type explicite) |
| **Definition** | L'ensemble ordonne des messages d'une conversation. Recupere via `GetHistoryUseCase` qui retourne un tableau de `ConversationMessage[]`. |
| **Contexte** | Conversation Context |
| **Relations** | Retourne par `GetHistoryUseCase`. Alimente par `SendMessageUseCase` et `CompleteOnboardingUseCase` (bulk insert de l'historique de decouverte). |
| **Fichiers** | `src/domains/conversation/use-cases/get-history.ts` |

### 2.3. ResponseGeneration / IResponseGenerator

| Attribut | Detail |
|----------|--------|
| **Nom** | ResponseGeneration / IResponseGenerator |
| **Definition** | Port abstrait pour la generation de reponses de l'assistant. L'implementation actuelle (`RandomResponseGenerator`) selectionne une reponse aleatoire dans une banque predefinie. A terme, ce port sera implemente par un appel a un LLM contextualise avec la memoire. |
| **Contexte** | Conversation Context |
| **Invariants** | L'interface expose une seule methode `generate(): string`. |
| **Relations** | Injecte dans `SendMessageUseCase`. L'implementation concrete est dans `src/data/response-generator.ts`. |
| **Fichiers** | `src/domains/conversation/ports/response-generator.ts`, `src/data/response-generator.ts` |

---

## 3. Client Knowledge Context

### 3.1. CompanyProfile

| Attribut | Detail |
|----------|--------|
| **Nom** | CompanyProfile |
| **Definition** | Profil synthetique de l'entreprise cliente. Contient les informations essentielles : nom, secteur d'activite, description (le probleme resolu), cible, ton de marque, et une reference optionnelle vers le `BusinessDiscovery` source. |
| **Contexte** | Client Knowledge Context |
| **Invariants** | L'id est genere automatiquement. Les champs `createdAt` et `updatedAt` sont geres par le repository. Le `discoveryId` (optionnel) lie le profil a sa source de decouverte. Tous les champs textuels sont obligatoires a la creation. |
| **Relations** | Cree par `CreateProfileUseCase` ou par `CompleteOnboardingUseCase` (via transformation de `BusinessDiscovery`). Recupere par `GetProfileUseCase`. Reference optionnellement un `BusinessDiscovery` via `discoveryId`. |
| **Fichiers** | `src/types/index.ts` (CompanyProfile), `src/domains/client-knowledge/ports/company-profile-repository.ts`, `src/domains/client-knowledge/use-cases/create-profile.ts` |

### 3.2. BusinessDiscovery

| Attribut | Detail |
|----------|--------|
| **Nom** | BusinessDiscovery |
| **Definition** | Livrable principal de l'agent de decouverte. Structure riche et normalisee qui capture l'integralite du contexte business d'un client apres un entretien de decouverte. Organisee en blocs : metadata, probleme, proposition de valeur, audiences, marketing actuel, contexte business, synthese narrative et hypotheses strategiques. |
| **Contexte** | Client Knowledge Context (stockage), Onboarding Context (consommation/transformation) |
| **Invariants** | Les 8 champs de premier niveau sont obligatoires. Le `sector` est contraint a `"saas" | "ecommerce" | "agency" | "startup" | "other"`. Le `completionStatus` est `"complete" | "partial"`. Les niveaux de douleur sont `"irritant" | "bloquant" | "critique"`. |
| **Relations** | Produit par l'agent Discovery (Claude Agent SDK). Stocke par `IBusinessDiscoveryRepository`. Consomme par `CompleteOnboardingUseCase` pour creer un `CompanyProfile` et enrichir la memoire semantique. |
| **Fichiers** | `src/types/business-discovery.ts` (interface complete), `src/domains/client-knowledge/ports/business-discovery-repository.ts`, `src/agents/discovery.ts` (schema JSON) |

### 3.3. Sector

| Attribut | Detail |
|----------|--------|
| **Nom** | Sector |
| **Definition** | Secteur d'activite de l'entreprise cliente. Utilise pour adapter les questions de decouverte et le contexte d'analyse. |
| **Contexte** | Client Knowledge Context (via BusinessDiscovery.metadata.sector et CompanyProfile.sector) |
| **Invariants** | Valeurs autorisees : `"saas"`, `"ecommerce"`, `"agency"`, `"startup"`, `"other"`. |
| **Relations** | Determine la banque de questions utilisee par le tool `suggestQuestions`. Stocke dans `CompanyProfile.sector` et `BusinessDiscovery.metadata.sector`. |
| **Fichiers** | `src/types/business-discovery.ts` (metadata.sector), `src/data/discovery-questions.ts` (banque de questions par secteur) |

### 3.4. BrandTone

| Attribut | Detail |
|----------|--------|
| **Nom** | BrandTone |
| **Definition** | Ton de la marque du client. Champ textuel libre dans `CompanyProfile`. |
| **Contexte** | Client Knowledge Context |
| **Invariants** | Chaine non vide obligatoire. Actuellement, le `CompleteOnboardingUseCase` force la valeur `"professionnel"` par defaut (hardcode). |
| **Relations** | Champ de `CompanyProfile`. |
| **Fichiers** | `src/types/index.ts` (CompanyProfile.brandTone), `src/domains/onboarding/use-cases/complete-onboarding.ts` (ligne 43) |

### 3.5. TargetAudience (concept implicite)

| Attribut | Detail |
|----------|--------|
| **Nom** | TargetAudience |
| **Definition** | Audience cible du client. Dans `CompanyProfile`, c'est une simple chaine (`target`). Dans `BusinessDiscovery`, c'est une structure riche avec segment, priorite, intensite de douleur, moment declencheur, contexte d'achat, langage, canaux et objections. |
| **Contexte** | Client Knowledge Context |
| **Invariants** | Dans `CompanyProfile` : chaine non vide. Dans `BusinessDiscovery` : structure complexe avec `priority` contraint a `"primary" | "secondary" | "exploratory"`. |
| **Relations** | Le `CompleteOnboardingUseCase` simplifie drastiquement la representation : `audiences[0]?.segment ?? "Non defini"` -> `CompanyProfile.target`. |
| **Fichiers** | `src/types/index.ts` (CompanyProfile.target), `src/types/business-discovery.ts` (audiences[]) |

---

## 4. Onboarding Context

### 4.1. CompleteOnboarding (processus)

| Attribut | Detail |
|----------|--------|
| **Nom** | CompleteOnboarding |
| **Definition** | Processus de finalisation de l'onboarding d'un nouveau client. Orchestre en sequence : stockage du BusinessDiscovery, creation du CompanyProfile, enrichissement massif de la memoire semantique (8 categories de faits), sauvegarde de l'historique conversationnel, et publication de l'evenement ONBOARDING_COMPLETED. |
| **Contexte** | Onboarding Context |
| **Invariants** | Requiert un `BusinessDiscovery` valide et un tableau de messages. L'execution est atomique (pas de transaction explicite mais execution sequentielle). |
| **Relations** | Depent de : `ICompanyProfileRepository` (Client Knowledge), `IBusinessDiscoveryRepository` (Client Knowledge), `ISemanticMemoryRepository` (Memory), `IConversationRepository` (Conversation). Publie : `ONBOARDING_COMPLETED`. |
| **Fichiers** | `src/domains/onboarding/use-cases/complete-onboarding.ts` |

### 4.2. DiscoveryInterview (concept implicite)

| Attribut | Detail |
|----------|--------|
| **Nom** | DiscoveryInterview |
| **Definition** | L'entretien de decouverte mene par l'agent Discovery. Structure en 4 blocs thematiques : (1) Probleme et Proposition de valeur, (2) Audiences et Segments, (3) Paysage marketing actuel, (4) Objectifs et Contexte business. L'agent sauvegarde progressivement chaque bloc via le tool `saveDiscoveryBlock`. |
| **Contexte** | Onboarding Context (processus) / Memory Context (stockage des blocs) |
| **Invariants** | L'interview est consideree complete quand les 4 blocs sont couverts (signale par le tool `signal_interview_complete`). Chaque bloc peut etre sauvegarde en mode brouillon ou valide. |
| **Relations** | Produit un `BusinessDiscovery` en sortie. Les blocs intermediaires sont stockes comme `Episode` de type `"discovery"` dans la memoire episodique. |
| **Fichiers** | `src/tools/discovery/index.ts` (saveDiscoveryBlock), `src/tools/discovery/tool-definitions.ts` (signal_interview_complete), `src/data/discovery-questions.ts` (banque de questions) |

### 4.3. OnboardingCompletion (evenement)

| Attribut | Detail |
|----------|--------|
| **Nom** | OnboardingCompletion / ONBOARDING_COMPLETED |
| **Definition** | Evenement domaine publie quand le processus d'onboarding est termine avec succes. Contient l'id du profil cree, le nom de l'entreprise et l'id du discovery. |
| **Contexte** | Onboarding Context (publieur) |
| **Invariants** | Publie une seule fois par execution de `CompleteOnboardingUseCase`. Le payload contient `profileId`, `companyName`, `discoveryId`. |
| **Relations** | Publie via le `DomainEventBus` (Shared Kernel). Actuellement non consomme par aucun handler. |
| **Fichiers** | `src/domains/shared/domain-events.ts` (constante), `src/domains/onboarding/use-cases/complete-onboarding.ts` (publication) |

---

## 5. Shared Kernel

### 5.1. MemoryId

| Attribut | Detail |
|----------|--------|
| **Nom** | MemoryId |
| **Definition** | Value Object immutable qui encapsule un identifiant de memoire. Suit le format `prefix-timestamp-random` (ex: `"ep-1700000000000-a1b2c"`). |
| **Contexte** | Shared Kernel |
| **Invariants** | Le format est valide par la regex `^[a-z]+-\d+-[a-z0-9]+$`. La construction echoue si le format est invalide. Deux `MemoryId` sont egaux si et seulement si leurs valeurs sont identiques. |
| **Relations** | Declare dans le Shared Kernel mais **actuellement non utilise par les repositories** (les IDs sont generes directement comme `string` dans les implementations). |
| **Fichiers** | `src/domains/shared/value-objects.ts` |

### 5.2. Timestamp

| Attribut | Detail |
|----------|--------|
| **Nom** | Timestamp |
| **Definition** | Value Object immutable qui encapsule une date au format ISO-8601. Fournit des methodes de comparaison (`isBefore`, `isAfter`, `equals`) et de conversion (`toDate`). |
| **Contexte** | Shared Kernel |
| **Invariants** | La chaine doit etre un ISO timestamp valide (parsable par `new Date()`). La construction echoue sinon. |
| **Relations** | Declare dans le Shared Kernel mais **actuellement non utilise directement** -- les dates sont manipulees comme des `string` ISO dans les types de domaine. |
| **Fichiers** | `src/domains/shared/value-objects.ts` |

### 5.3. ConfidenceLevel

| Attribut | Detail |
|----------|--------|
| **Nom** | ConfidenceLevel |
| **Definition** | Value Object immutable representant le niveau de confiance accorde a une connaissance apprise. Trois niveaux ordonnes : `low` < `medium` < `strong`. Fournit des methodes de comparaison (`isHigherThan`, `isAtLeast`). |
| **Contexte** | Shared Kernel |
| **Invariants** | Valeurs autorisees : `"low"`, `"medium"`, `"strong"`. Instances singleton (`ConfidenceLevel.LOW`, `.MEDIUM`, `.STRONG`). |
| **Relations** | Utilise pour valider les inputs dans `AddPreferenceUseCase` et `AddLearnedRuleUseCase`. Coexiste avec le type `ConfidenceLevel` (string union) de `src/types/memory.ts` -- voir section Incoherences. |
| **Fichiers** | `src/domains/shared/value-objects.ts` |

### 5.4. Importance

| Attribut | Detail |
|----------|--------|
| **Nom** | Importance |
| **Definition** | Value Object immutable representant le niveau d'importance d'un element. Trois niveaux ordonnes : `low` < `medium` < `high`. Fournit des methodes de comparaison (`isHigherThan`, `isAtLeast`). |
| **Contexte** | Shared Kernel |
| **Invariants** | Valeurs autorisees : `"low"`, `"medium"`, `"high"`. Instances singleton. |
| **Relations** | Utilise pour valider les inputs dans `RecordEpisodeUseCase`. |
| **Fichiers** | `src/domains/shared/value-objects.ts` |

### 5.5. Tag

| Attribut | Detail |
|----------|--------|
| **Nom** | Tag |
| **Definition** | Value Object immutable representant un mot-cle de categorisation. Encapsule une chaine non vide et trimmee. |
| **Contexte** | Shared Kernel |
| **Invariants** | La chaine ne peut pas etre vide apres trim. Deux Tags sont egaux si leurs valeurs sont identiques. |
| **Relations** | Utilise pour valider les tags dans `RecordEpisodeUseCase`. Les tags sont stockes comme `string[]` dans les types de domaine. |
| **Fichiers** | `src/domains/shared/value-objects.ts` |

### 5.6. DomainEvent

| Attribut | Detail |
|----------|--------|
| **Nom** | DomainEvent |
| **Definition** | Interface de base pour tous les evenements domaine. Chaque evenement a un type (chaine constante), une date d'occurrence et un payload arbitraire. |
| **Contexte** | Shared Kernel |
| **Invariants** | Les champs `type`, `occurredAt` et `payload` sont obligatoires et en lecture seule. |
| **Relations** | Publie et consomme via `DomainEventBus`. |
| **Fichiers** | `src/domains/shared/domain-events.ts` |

### 5.7. DomainEventBus

| Attribut | Detail |
|----------|--------|
| **Nom** | DomainEventBus |
| **Definition** | Bus d'evenements synchrone simple. Les handlers sont invoques dans l'ordre d'inscription quand un evenement est publie. Un singleton global (`domainEventBus`) est partage par tous les contextes. |
| **Contexte** | Shared Kernel |
| **Invariants** | Les handlers sont invoques synchroniquement (pas de promesses). Un evenement sans handler est silencieusement ignore. La methode `clear()` supprime tous les handlers (utile pour les tests). |
| **Relations** | Utilise par `AddClientFactUseCase`, `AddPreferenceUseCase`, `SendMessageUseCase`, `CompleteOnboardingUseCase` pour publier des evenements. |
| **Fichiers** | `src/domains/shared/domain-events.ts` |

---

## 6. Incoherences et recommandations

### 6.1. Doublon de type : `ConfidenceLevel` (Value Object vs string union)

**Probleme** : Le terme `ConfidenceLevel` existe sous deux formes incompatibles :
- **Value Object** dans `src/domains/shared/value-objects.ts` : classe immutable avec methodes de comparaison, valeurs `"low" | "medium" | "strong"`
- **String union** dans `src/types/memory.ts` : `type ConfidenceLevel = "low" | "medium" | "strong"`

Les use cases (`AddPreferenceUseCase`, `AddLearnedRuleUseCase`) importent les deux et doivent aliaser le Value Object (`ConfidenceLevel as ConfidenceLevelVO`) pour eviter le conflit de noms.

**Recommandation** : Migrer tous les usages vers le Value Object du Shared Kernel. Supprimer le type string union de `src/types/memory.ts`. Adapter les interfaces des repositories pour accepter le Value Object plutot que la string.

---

### 6.2. Ambiguite : `Episode` vs `EpisodicContext` vs `EpisodicMemory`

**Probleme** : Trois termes proches designent des concepts differents :
- `Episode` : une entree unitaire (un evenement enregistre)
- `EpisodicContext` : la projection en lecture d'une fenetre temporelle d'episodes, feedbacks, taskResults et patterns
- `EpisodicMemory` (implicite dans le nom de store `EpisodicMemoryStore`) : le store complet

Le terme "EpisodicMemory" n'apparait pas comme type explicite mais comme nom de store, ce qui peut creer une confusion avec le concept general de "memoire episodique".

**Recommandation** : Clarifier dans la documentation que `EpisodicMemory` designe le store (l'infrastructure) tandis qu'`EpisodicContext` est le modele de lecture du domaine. Considerer renommer le store en `EpisodicMemoryAdapter` pour marquer clairement son role d'infrastructure.

---

### 6.3. Chevauchement : `ClientFact` vit dans Memory mais concerne Client Knowledge

**Probleme** : Le type `ClientFact` (fait client) est defini dans `src/types/memory.ts`, gere par `ISemanticMemoryRepository` (Memory Context), et cree par `AddClientFactUseCase` (Memory Context). Cependant, conceptuellement, les faits sur le client (nom, secteur, probleme, audiences) appartiennent au domaine de la connaissance client.

L'enrichissement massif par `CompleteOnboardingUseCase` (qui cree des dizaines de ClientFacts a partir de BusinessDiscovery) renforce cette ambiguite : les faits clients sont le pont entre Client Knowledge et Memory.

**Recommandation** : Deux strategies possibles :
1. **Accepter le chevauchement** et le documenter comme un choix architectural delibere : "ClientFact est le format dans lequel la connaissance client est stockee en memoire semantique". Memory est le mecanisme de stockage, Client Knowledge est la source de verite structuree.
2. **Introduire un ACL** dans Onboarding qui transforme explicitement les concepts de Client Knowledge (`BusinessDiscovery`) en concepts de Memory (`ClientFact`) via un service de traduction dedie.

---

### 6.4. Types partages hors du Shared Kernel

**Probleme** : Les fichiers `src/types/memory.ts`, `src/types/index.ts` et `src/types/business-discovery.ts` contiennent des types utilises par plusieurs contextes mais ne font pas partie du Shared Kernel (`src/domains/shared/`). Il y a une double source de types partages.

**Recommandation** : Reorganiser les types :
- Les types specifiques a Memory (`Episode`, `Feedback`, `SemanticContext`, etc.) devraient vivre dans `src/domains/memory/types.ts`
- Les types specifiques a Client Knowledge (`CompanyProfile`, `BusinessDiscovery`) devraient vivre dans `src/domains/client-knowledge/types.ts`
- Seuls les types genuinement partages (`ConversationMessage` utilise par Conversation ET Onboarding) restent dans un fichier commun ou integrent le Shared Kernel

---

### 6.5. `MemoryId` et `Timestamp` : Value Objects declares mais non utilises

**Probleme** : Les Value Objects `MemoryId` et `Timestamp` sont definis dans le Shared Kernel avec validation et methodes de comparaison, mais aucun code ne les utilise. Les IDs sont generes comme des `string` brutes dans les stores (`ep-${Date.now()}-...`) et les timestamps sont manipules comme des `string` ISO.

**Recommandation** : Soit adopter ces Value Objects dans les repositories et use cases (ce qui apporterait une meilleure validation a l'execution), soit les supprimer pour eviter le code mort et la confusion.

---

### 6.6. `BrandTone` : valeur hardcodee dans Onboarding

**Probleme** : Le champ `brandTone` de `CompanyProfile` est force a `"professionnel"` dans `CompleteOnboardingUseCase` (ligne 43). Cette information n'est pas extraite du `BusinessDiscovery` (qui ne contient pas de champ de ton de marque).

**Recommandation** : Ajouter un champ `brandTone` ou `communicationStyle` au schema `BusinessDiscovery` pour que cette information soit collectee pendant l'entretien de decouverte plutot que hardcodee.

---

### 6.7. `Message` vs `ConversationMessage` vs `ChatMessage`

**Probleme** : Trois interfaces representent un "message" dans `src/types/index.ts` :
- `Message` : avec `projectId`, `role`, `content`, `createdAt`
- `ConversationMessage` : avec `role`, `content`, `createdAt` (sans `projectId`)
- `ChatMessage` : avec `role`, `content` (sans `createdAt`)

Ces trois types representent le meme concept a des niveaux de detail differents, ce qui cree de la confusion.

**Recommandation** : Consolider en un seul type `Message` avec des champs optionnels, ou clarifier les responsabilites : `ChatMessage` pour le frontend (UI), `ConversationMessage` pour le domaine Conversation, `Message` pour la couche donnees projets. Documenter explicitement la frontiere de chaque type.

---

### 6.8. Agent Discovery : pas un Bounded Context formel

**Probleme** : L'agent Discovery (`src/agents/discovery.ts`, `src/tools/discovery/`) et les questions (`src/data/discovery-questions.ts`) forment un sous-systeme coherent avec son propre langage (blocs, interview, choices, signal_interview_complete), mais il n'est pas structure comme un Bounded Context avec ports/use-cases/services.

**Recommandation** : Considerer la formalisation d'un contexte "Discovery Agent" avec ses propres ports (ex: `IDiscoveryInterviewPort`, `IWebsiteAnalyzer`, `ICompetitorAnalyzer`) pour clarifier les frontieres. Alternativement, le documenter comme une couche d'infrastructure du contexte Onboarding.

---

### 6.9. Absence d'`Importance` dans la chaine semantique

**Probleme** : Le Value Object `Importance` est utilise pour valider le champ `importance` des `Episode`, mais les `ClientFact`, `ValidatedPattern` et `LearnedRule` de la memoire semantique n'ont pas de notion de priorite ou d'importance. Cela signifie que lors de la consolidation, l'importance d'un episode est perdue quand son contenu est promu en connaissance semantique.

**Recommandation** : Evaluer si un niveau d'importance ou de priorite serait utile sur les elements semantiques pour permettre un meilleur filtrage et une meilleure priorisation des connaissances.

---

### Synthese des priorites

| # | Incoherence | Severite | Effort | Priorite |
|---|-------------|----------|--------|----------|
| 6.1 | Doublon `ConfidenceLevel` | Moyenne | Faible | Haute |
| 6.7 | Triple type Message | Moyenne | Faible | Haute |
| 6.5 | Value Objects non utilises | Faible | Faible | Moyenne |
| 6.3 | ClientFact entre deux contextes | Moyenne | Moyen | Moyenne |
| 6.4 | Types hors Shared Kernel | Faible | Moyen | Moyenne |
| 6.6 | BrandTone hardcode | Faible | Faible | Moyenne |
| 6.2 | Ambiguite Episode/EpisodicContext | Faible | Faible | Basse |
| 6.8 | Agent non formalise | Faible | Eleve | Basse |
| 6.9 | Importance perdue a la promotion | Faible | Moyen | Basse |
