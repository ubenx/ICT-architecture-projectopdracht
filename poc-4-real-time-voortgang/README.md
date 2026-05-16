# PoC 4: Real-time voortgang via WebSockets

## Technische vraag

Kan een leerkracht in real-time zien hoe leerlingen vorderen, zonder constant de pagina te moeten verversen of polling te gebruiken?

---

## Wat doet deze PoC?

Deze PoC toont een minimale real-time communicatiestroom met WebSockets via Socket.IO.

Er zijn drie kleine processen:

- Een student simulator die voortgangsupdates verstuurt
- Een Node.js + Express backend die updates ontvangt
- Een teacher dashboard dat live updates ontvangt via WebSockets

De backend bewaart voortgang tijdelijk in geheugen en broadcast nieuwe updates onmiddellijk naar alle verbonden clients.

De PoC bevat bewust geen volledige frontend, database of authenticatie. De focus ligt enkel op de technische vraag: kunnen realtime voortgangsupdates live gepusht worden?

---

## Opstarten

```bash
docker stack deploy -c poc.yaml poc
```

## Real-time gedrag testen

Bekijk de logs van de verschillende services in aparte terminals:

```bash
docker service logs -f poc_server
```

```bash
docker service logs -f poc_student
```

```bash
docker service logs -f poc_teacher
```

Wat je zou moeten zien:

- `poc_student` verstuurt periodiek voortgangsupdates
- `poc_server` ontvangt deze updates en broadcast ze via WebSockets
- `poc_teacher` ontvangt onmiddellijk de nieuwe voortgang zonder polling of pagina-refresh

Dit bewijst dat de communicatie realtime gebeurt via Socket.IO/WebSockets.
