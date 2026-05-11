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
