# ICT Architecture — Educatieve Programmeergame

Architectuurproject voor het vak ICT Architecture. We ontwerpen de architectuur voor een educatieve game waarin spelers leren programmeren via puzzels en levels.

## Structuur

- `document.md` — Het architectuurdocument (karakteristieken, componenten, ADR's, C4-diagrammen)
- `poc-1-sandbox/` — PoC: Sandboxed code execution met Docker
- `poc-2-levels/` — PoC: Levels laden en valideren als JSON plug-ins
- `poc-3-editor/` — PoC: Code-editor met visuele feedback (Monaco + Canvas)
- `poc-4-real-time-voortgang/` — PoC: Real-time voortgang via WebSockets
- `poc-5-authenticatie/` — PoC: JWT authenticatie en rolgebaseerde autorisatie

## PoC's opstarten

Elke PoC kan opgestart worden met:

```bash
cd poc-X-naam
docker stack deploy -c poc.yaml poc
```

Zie de README.md in elke PoC-map voor specifieke instructies.
