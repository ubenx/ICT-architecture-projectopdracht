# PoC 2 — Microkernel level plug-ins

## Technische vraag

Kunnen we verschillende leveltypes als plug-ins laden, waarbij JSON-levels dynamisch gekoppeld worden aan de juiste validatielogica zonder de kernapplicatie aan te passen?

## Doel van deze PoC

Deze PoC demonstreert het microkernel-principe uit onze architectuur.

De kernapplicatie kent enkel een algemeen plug-in contract (`LevelPlugin`). Concrete leveltypes, zoals grid-levels, worden toegevoegd als aparte plug-ins die hun eigen validatie- en execution-logica bevatten.

Concrete levels zelf zijn geen plug-ins maar configuratiedata in JSON-formaat. Elk level verwijst via `levelType` naar de juiste plug-in.

## Structuur

```text
app/
├── core/
│   └── pluginRegistry.js
│
├── plugins/
│   └── gridPlugin.js
│
├── levels/
│   ├── level1.json
│   ├── level2.json
│   ├── level3.json
│   └── level-invalid.json
│
└── index.js
```

## Hoe opstarten

```bash
docker stack deploy --compose-file poc.yaml poc
```

## Output bekijken

```bash
docker service logs poc_app --follow
```

## Hoe werkt het?

1. De app leest alle `.json` bestanden in de `levels/` map.
2. Elk level bevat een `levelType`.
3. De core valideert het JSON-level tegen een JSON-schema.
4. Via `levelType` zoekt de core de juiste plug-in op in de plugin registry.
5. De plug-in bevat de validatie- en execution-logica voor dat type level.
6. De core roept `plugin.validate(level, solution)` aan om te controleren of het level oplosbaar is.
7. Geldige levels worden opgeslagen in MongoDB.
8. Ongeldige levels of onbekende leveltypes worden geweigerd.

## Waarom is dit een microkernel PoC?

De kernapplicatie bevat geen specifieke kennis over grid-levels of andere leveltypes.

De core kent enkel:

- het plug-in contract
- de plugin registry
- het laadmechanisme

De concrete logica zit volledig in aparte plug-ins zoals `gridPlugin`.

Nieuwe leveltypes kunnen toegevoegd worden zonder de kernapplicatie te wijzigen. Enkel een nieuwe plug-in moet geregistreerd worden.

## Voorbeeld plug-in contract

```javascript
module.exports = {
  levelType: "grid",

  validate(level, solution) {
    // validatielogica
  },

  getDockerImage() {
    return "python:3.12";
  },
};
```

## Nieuw level toevoegen

Maak een nieuw `.json` bestand aan in de `levels/` map met een bestaand `levelType`.

Voorbeeld:

```json
{
  "id": "level-004",
  "levelType": "grid"
}
```

Geen code aanpassen nodig.

## Nieuw leveltype toevoegen

1. Maak een nieuwe plug-in in de `plugins/` map.
2. Implementeer het plug-in contract.
3. Registreer de plug-in in `core/pluginRegistry.js`.

De kernapplicatie hoeft verder niet aangepast te worden.

## Stoppen

```bash
docker stack rm poc
```
