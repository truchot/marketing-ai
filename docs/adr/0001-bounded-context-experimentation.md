# ADR-0001 — Bounded Context `experimentation` (boucle Hypothèse → Produire)

- **Statut** : Accepté
- **Date** : 2026-06-01
- **Décideurs** : Florian Truchot
- **Contextes liés** : `strategy`, `memory`, `client-knowledge`

## Contexte et problème

Le produit doit permettre à une startup de produire son marketing de manière
**« mécanique » et data-driven**. Le pipeline existant s'arrête à la stratégie :

```
CompanyProfile → Discovery → Strategy (diagnostic + OKR + Action + ExecutionRoadmap)
```

Trois manques empêchent de fermer la boucle :

1. **Pas de couche d'exécution cadencée.** `ExecutionRoadmap` range les `Action` en
   3 phases temporelles grossières (0-30 / 30-90 / 90+ jours). Il n'existe ni rythme
   hebdomadaire, ni rythme quotidien — donc rien qui transforme une intention
   stratégique en production tenable jour après jour.

2. **Pas de falsifiabilité.** Une `Action` décrit une intention (« créer une page SEO »)
   mais ne porte ni hypothèse, ni métrique de succès, ni seuil. Impossible de savoir
   si elle a « marché » → impossible d'être data-driven.

3. **Le scoring est incomplet.** `Action` porte déjà `impact` et `effort`
   (le **I** et le **E** d'un score ICE), mais **pas la confiance** (**C**) — or c'est
   précisément la variable qu'alimentent les données disponibles (benchmarks,
   concurrents, résultats first-party, analytics).

**Problème particulier de la startup : le cold-start.** Une startup n'a quasiment pas
de données propres (peu de trafic, peu de conversions). Une approche « analyser
l'historique » est donc inopérante au démarrage.

## Facteurs de décision

- **Cold-start** : produire de la valeur dès J1, sans données first-party.
- **Mode copilote** : la machine propose, le fondateur valide/publie (contrôle marque).
- **Réutilisation** : ne pas dupliquer les concepts déjà modélisés dans `strategy`.
- **Capitalisation** : chaque cycle doit enrichir la mémoire (effet composé = moat).
- **Tenabilité** : un rythme que le fondateur peut soutenir (≈ 1 validation/jour).

## Options envisagées

### Option A — Étendre l'agrégat `Strategy`
Ajouter hypothèses, scores et plan quotidien directement dans `StrategyAggregate`.

- ➖ Mélange deux cycles de vie distincts (la stratégie est validée et stable ;
  l'expérimentation court, se mesure, apprend). Agrégat obèse, frontière de
  cohérence floue.
- ➖ Mute un livrable censé rester une source de vérité.

### Option B — Générateur de contenu autonome (« canon à contenu »)
Produire en masse des assets à partir des OKR, sans boucle de mesure.

- ➖ Mécanique mais **pas** data-driven : ça crache, ça ne mesure pas, ça n'apprend pas.
- ➖ Aucun effet composé, contenu orphelin non relié aux objectifs.

### Option C — Nouveau Bounded Context `experimentation` (retenue)
Un contexte dédié qui **lit** `strategy` (sans la muter) et insère **deux niveaux de
cadence** sous la roadmap : l'`Experiment` (hebdo) et la `DailyAction` (quotidien).

- ➕ Sépare proprement le « quoi tester » (stratégie) du « comment/quand exécuter ».
- ➕ Réutilise `impact`/`effort` de `Action` et ne complète que ce qui manque (Confidence + falsifiabilité).
- ➕ Cycle de vie propre (draft → running → concluded) aligné sur une vraie boucle d'apprentissage.

## Décision

Créer le Bounded Context **`experimentation`**, organisé autour de la hiérarchie :

```
OKR (trimestre)                                   ── strategy (existant)
 └─ KeyResult (métrique cible)                      ── strategy (existant)
     └─ Action (initiative — impact + effort)        ── strategy (existant)
         └─ Experiment (pari TESTABLE)                ── experimentation · cadence HEBDO
         │    + hypothèse falsifiable (seuil)
         │    + confidence  ← complète l'ICE
         │    + confidenceSources[] (les 4 sources de données)
         │    + successMetric + seuil
         └──── DailyAction (atome shippable)          ── experimentation · cadence QUOTIDIENNE
```

### Règles de modélisation

1. **Agrégat racine `Experiment`**, qui **possède** ses `DailyAction` en **entités
   enfants**. C'est le premier agrégat du projet avec entités enfants : la planification
   quotidienne fait partie de la cohérence de l'expérience et n'est modifiable qu'à
   travers la racine (pas de mutation externe directe d'une `DailyAction`).

2. **`Experiment` référence `strategy`, ne la mute jamais.**
   - `keyResultId` : **requis** — c'est le garde-fou. Toute expérience sert un KR mesurable.
   - `actionId` : **optionnel** — la plupart des expériences « promeuvent » une `Action`
     existante, mais la machine peut créer une expérience *net-new* issue de
     l'intelligence marché. Dans tous les cas, `keyResultId` reste obligatoire.

3. **Falsifiabilité obligatoire.** Un `Experiment` ne peut pas être créé sans un
   `threshold` (seuil de succès) non vide. Si on ne sait pas mesurer, on ne teste pas.

4. **Score ICE = (Impact + Confidence + Ease) / 3**, chaque dimension sur 1-10.
   - `Impact` et `Ease` sont **amorcés** depuis l'`Action` source (mapping
     `low=3 / medium=6 / high=9` ; `Ease` = inverse de l'`effort`).
   - `Confidence` est alimentée par `confidenceSources[]`.

5. **Les 4 sources de données alimentent une seule variable : la `Confidence`.**
   Elles se **superposent dans le temps** (résout le cold-start) :
   | Maturité | Source dominante | Type `ConfidenceSource` |
   |---|---|---|
   | Boucle 0 (J1) | benchmarks secteur + intelligence concurrents | `sector_benchmark`, `competitor_intel` |
   | Boucles 1→N | + résultats first-party, analytics | `first_party_result`, `own_analytics` |
   | Maturité | + règles apprises sur la startup | `semantic_memory` |
   La machine **sèvre** progressivement le benchmark au profit du first-party.

6. **`DailyPlan` est une projection (read-model), pas un agrégat.** Il aplatit les
   `DailyAction` de tous les `Experiment` pour répondre à « que shippe-t-on aujourd'hui ? ».

### Cadence

- **Hebdo (lundi)** : la machine promeut des `Action` en `Experiment`, calcule la
  confiance, score ICE, propose un backlog trié. Le fondateur **pioche 2-3 experiments**
  (le backlog de la semaine), et la machine ré-ingère les résultats de la semaine passée
  dans la confiance des suivants (recalibrage = point d'entrée de la future phase Mesurer).
- **Quotidien** : chaque `Experiment` sélectionné est décliné en `DailyAction` sur la
  semaine, borné par la **capacité du fondateur** (≈ 1 validation/jour). Deux patterns :
  contenu cadencé (1 atome/jour) ou build (sous-tâches outline → draft → ship).

### Périmètre MVP

Ce premier incrément couvre l'arc **Hypothèse → Produire** :
`create` / `promoteFromAction` → `selectForWeek` → `planDailyAction` → `produceAsset`
→ `validate`/`ship` (copilote). La diffusion et la mesure restent **manuelles**.

**Anticipation explicite** : les champs `result` et `learning` ainsi que la transition
`conclude()` sont modélisés **dès maintenant** (même s'ils restent inutilisés au MVP),
pour que la boucle Mesurer → Apprendre se branche plus tard **sans refonte de l'agrégat**.

### Événements de domaine

- `EXPERIMENT_CREATED` — à la création d'une expérience.
- `EXPERIMENT_CONCLUDED` — à la clôture avec résultat (phase Mesurer, future).

## Conséquences

### Positives
- Boucle fermée et capitalisante : chaque cycle enrichit la mémoire (effet composé).
- Aucune duplication : `strategy` reste la source de vérité, lue en seule lecture.
- Le cold-start est traité par construction (confiance superposée dans le temps).
- Causalité traçable de bout en bout : `DailyAction → Experiment → KeyResult → OKR`
  (pas de contenu orphelin).
- Frontière de cohérence nette : la planif quotidienne est protégée par la racine.

### Négatives / risques
- **Premier agrégat à entités enfants** → plus complexe que `Episode`/`CompanyProfile`
  (« small aggregates »). À surveiller : taille de l'agrégat si une expérience accumule
  beaucoup de `DailyAction` (mitigation : borne temporelle = la semaine).
- **Dépendance amont sur `strategy`** : `experimentation` est *Customer* de `strategy`
  (relation Customer-Supplier à inscrire dans le Context Map).
- **Intelligence marché** : la qualité de la `Confidence` dépend des tools de collecte
  (SERP/sites concurrents via SDK ; ad libraries = incrément ultérieur).
- **Cohérence terme à terme** : `Action.impact/effort` (niveaux) ↔ ICE (1-10) → mapping
  centralisé à maintenir.

## Suites
- Mettre à jour `docs/CONTEXT_MAP.md` (ajout du contexte + relation Customer-Supplier vers `strategy`).
- Mettre à jour `docs/UBIQUITOUS_LANGUAGE.md` (Experiment, DailyAction, Hypothesis, ICE, ConfidenceSource).
- Tests unitaires de l'agrégat (objectif : 100 % des invariants, aligné sur la culture de test du projet).
- Tools MCP `experimentation` (analyse concurrents, scoring, production de variantes) + endpoints structured-output.
- Phase ultérieure : Mesurer → Apprendre (`conclude` + écriture en mémoire sémantique).
