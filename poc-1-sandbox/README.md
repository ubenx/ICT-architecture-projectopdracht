# PoC 1: Sandboxed Code Execution

## Technische vraag

Kunnen we gebruikerscode veilig uitvoeren in een Docker container met CPU-, geheugen- en tijdslimieten?

## Wat doet deze PoC?

Deze PoC toont een simpele webinterface waar je Python-code kunt invoeren en uitvoeren. De code wordt **niet** rechtstreeks op de server uitgevoerd, maar in een wegwerp Docker container met strikte beperkingen:

- **Geen netwerktoegang** — de code kan niets downloaden of versturen
- **Tijdslimiet van 5 seconden** — oneindige loops worden automatisch gestopt
- **Geheugenlimiet van 64MB** — de code kan de server niet laten crashen
- **Read-only bestandssysteem** — de code kan niets schrijven naar de schijf
- **Non-root gebruiker** — de code draait zonder beheerdersrechten

Na uitvoering wordt de container automatisch verwijderd.

## Opstarten

```bash
docker stack deploy -c poc.yaml poc
```

## Gebruiken

1. Open je browser en ga naar `http://localhost:3000`
2. Je ziet een tekstveld waar je Python-code kunt invoeren
3. Er staan voorbeelden klaar die je kunt testen:
   - **Normale code** — `print("Hello World")` → toont de output
   - **Oneindige loop** — `while True: pass` → wordt na 5 seconden gestopt
   - **Te veel geheugen** — `x = "A" * 10**9` → wordt gestopt door geheugenlimiet
   - **Netwerktoegang** — `import urllib.request; ...` → faalt omdat netwerk uitgeschakeld is
   - **Bestandssysteem** — `open("/etc/passwd").read()` → faalt door read-only bestandssysteem
4. Klik op **"Uitvoeren"** en bekijk het resultaat

## Stoppen

```bash
docker stack rm poc
```

## Architectuur

```
Browser → Node.js API → Docker Engine → Wegwerp Python Container
                                         ├── geen netwerk
                                         ├── max 5 seconden
                                         ├── max 64MB geheugen
                                         ├── read-only filesystem
                                         └── wordt na uitvoering verwijderd
```

## Technologieën

- **Node.js + Express** — API die code ontvangt en Docker aanstuurt
- **Dockerode** — Node.js library om Docker containers te beheren
- **Python 3 Alpine** — lichtgewicht Docker image voor code-uitvoering
