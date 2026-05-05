# PoC 3: Code-editor met visuele feedback

## Technische vraag

Kunnen we een code-editor integreren die bij het uitvoeren een visueel resultaat toont (een personage dat beweegt op een grid)?

## Wat doet deze PoC?

Deze PoC toont een webpagina met:

- **Links:** een code-editor (Monaco Editor) waar je commando's typt
- **Rechts:** een grid met een personage dat beweegt op basis van je code
- **Een "Run" knop:** voert de commando's uit en animeert het personage

De beschikbare commando's zijn:
- `moveForward()` — beweeg 1 vakje vooruit
- `turnLeft()` — draai 90 graden naar links
- `turnRight()` — draai 90 graden naar rechts

## Opstarten

```bash
docker stack deploy -f poc.yaml poc
```

## Gebruiken

1. Open je browser en ga naar `http://localhost:8080`
2. Je ziet links een code-editor en rechts een grid met een personage
3. Typ commando's in de editor, bijvoorbeeld:
   ```
   moveForward()
   moveForward()
   turnRight()
   moveForward()
   ```
4. Klik op **"Run"**
5. Het personage beweegt stap voor stap over het grid

## Stoppen

```bash
docker stack rm poc
```

## Technologieën

- **Monaco Editor** — de code-editor uit VS Code, als web-component
- **HTML5 Canvas** — voor het tekenen van het grid en het personage
- **Vanilla JavaScript** — geen framework nodig voor deze PoC
- **Nginx** — om de statische bestanden te serveren in Docker
