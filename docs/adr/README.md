# Architecture Decision Records (ADR)

Ce dossier consigne les **décisions d'architecture structurantes** du projet Marketing AI.

Une ADR capture une décision à un instant T : le contexte, les options envisagées,
le choix retenu et ses conséquences. Une ADR ne se modifie pas une fois acceptée —
si une décision est revue, on crée une nouvelle ADR qui **remplace** (`Supersedes`)
l'ancienne, et l'ancienne passe au statut `Superseded by ADR-XXXX`.

## Convention

- **Nommage** : `NNNN-titre-en-kebab-case.md` (numérotation séquentielle à partir de `0001`).
- **Format** : [MADR](https://adr.github.io/madr/) simplifié, rédigé en français.
- **Statuts** : `Proposé` → `Accepté` → (`Déprécié` | `Remplacé par ADR-XXXX`).

## Gabarit

```markdown
# ADR-NNNN — Titre

- **Statut** : Proposé | Accepté | Déprécié | Remplacé par ADR-XXXX
- **Date** : AAAA-MM-JJ
- **Décideurs** : …

## Contexte et problème

## Facteurs de décision

## Options envisagées

## Décision

## Conséquences
### Positives
### Négatives / risques
```

## Index

| ADR | Titre | Statut |
|-----|-------|--------|
| [0001](./0001-bounded-context-experimentation.md) | Bounded Context `experimentation` (boucle Hypothèse → Produire) | Accepté |
