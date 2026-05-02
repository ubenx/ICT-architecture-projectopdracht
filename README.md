# Level Schema — Uitleg voor het team

## Wat is dit?

Dit is het **level-schema**: de afspraak over hoe elk level eruitziet. Iedereen die met levels werkt (PoC 2, 3 en 5) moet dit formaat gebruiken.

## De bestanden

| Bestand | Wat is het? |
|---|---|
| `level-schema.json` | De regels waaraan elk level moet voldoen |
| `level-001.json` | Voorbeeldlevel 1: "Eerste Stappen" (simpel, rechte lijn) |
| `level-002.json` | Voorbeeldlevel 2: "Om de Muur" (muren, draaien) |
| `level-003.json` | Voorbeeldlevel 3: "Verzamel de Sterren" (herhaling, collectibles) |

## Hoe zit een level in elkaar?

Elk level is een JSON-bestand met deze velden:

### Verplichte velden

- **id** — Uniek ID, bv. `"level-001"`
- **name** — Naam die de speler ziet, bv. `"Eerste Stappen"`
- **difficulty** — Getal van 1 (makkelijk) tot 5 (moeilijk)
- **description** — Korte uitleg voor de speler
- **grid** — Het speelveld (zie hieronder)
- **availableCommands** — Welke commando's de speler mag gebruiken
- **maxCommands** — Maximum aantal commando's (voor de uitdaging)
- **solution** — Een geldige oplossing (om te testen of het level oplosbaar is)

### Optionele velden

- **concept** — Welk programmeerconcept het level aanleert (sequentie, herhaling, conditie, functies, variabelen)
- **hint** — Een hint die de speler kan opvragen

### Het grid

Het grid beschrijft het speelveld:

```
(0,0)  (1,0)  (2,0)  (3,0)  (4,0)
(0,1)  (1,1)  (2,1)  (3,1)  (4,1)
(0,2)  (1,2)  (2,2)  (3,2)  (4,2)
(0,3)  (1,3)  (2,3)  (3,3)  (4,3)
(0,4)  (1,4)  (2,4)  (3,4)  (4,4)
```

- **width/height** — Grootte van het grid (minimaal 3x3, maximaal 20x20)
- **start** — Waar het personage begint + welke richting het kijkt (north/east/south/west)
- **goal** — Waar het personage naartoe moet
- **walls** — Lijst van vakjes waar muren staan (het personage kan hier niet doorheen)
- **collectibles** — Optioneel: items die het personage moet oppakken

### Beschikbare commando's

Dit zijn alle commando's die in de game bestaan:

| Commando | Wat doet het? |
|---|---|
| `moveForward` | Beweeg 1 vakje vooruit (de richting waar het personage naar kijkt) |
| `turnLeft` | Draai 90 graden naar links |
| `turnRight` | Draai 90 graden naar rechts |
| `repeat` | Herhaal een commando meerdere keren |
| `if_wall` | Doe iets alleen als er een muur voor je staat |
| `if_no_wall` | Doe iets alleen als er GEEN muur voor je staat |
| `pickup` | Pak een collectible op (als er een op je vakje ligt) |

Niet elk level heeft alle commando's. Het veld `availableCommands` bepaalt welke commando's beschikbaar zijn voor dat specifieke level. Zo kun je de moeilijkheid opbouwen: level 1 heeft alleen moveForward/turnLeft/turnRight, terwijl latere levels repeat en if_wall toevoegen.

## Visueel voorbeeld: Level 002 "Om de Muur"

```
  0   1   2   3   4
0 .   .   █   .   .
1 .   .   █   .   .
2 S   .   █   .   G
3 .   .   █   .   .
4 .   .   .   .   .

S = start (x:0, y:2, kijkt naar east)
G = goal (x:4, y:2)
█ = muur
. = leeg vakje
```

De speler moet om de muur heen navigeren. Een oplossing: ga omhoog, ga langs de muur, ga weer omlaag.

## Wie heeft welk bestand nodig?

- **Persoon 2 (Level laden):** Gebruikt het schema + voorbeeldlevels om te testen of levels correct geladen en gevalideerd worden
- **Persoon 3 (Code-editor):** Gebruikt de voorbeeldlevels om het grid te tekenen en commando's te testen
- **Persoon 5 (Level editor):** De editor moet levels genereren die aan dit schema voldoen
