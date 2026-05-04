# PoC 2 — Level laden als plug-in

## Technische vraag

Kunnen we levels definiëren als JSON-documenten en die dynamisch laden
in een game engine, zonder de applicatiecode aan te passen?

## Hoe opstarten

```bash
docker stack deploy --compose-file poc.yaml poc
```

## Output bekijken

```bash
docker service logs poc_app --follow
```

## Hoe werkt het?

1. De app leest alle `.json` bestanden in de `levels/` map
2. Elk level wordt gevalideerd tegen een JSON-schema
3. Ongeldige levels worden geweigerd met een foutmelding
4. De oplossing van elk level wordt gesimuleerd om te bewijzen dat het oplosbaar is
5. Geldige levels worden opgeslagen in MongoDB
6. De app filtert levels op moeilijkheidsgraad en toont statistieken per thema

## Nieuw level toevoegen

Maak een nieuw `.json` bestand aan in de `levels/` map.
Geen code aanpassen nodig. De app pikt het automatisch op.

## Stoppen

```bash
docker stack rm poc
```