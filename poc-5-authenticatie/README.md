# PoC 5 — Authenticatie (JWT)

## Technische vraag

Kunnen we gebruikers authenticeren via JWT en op basis van hun rol de toegang tot endpoints beperken?

## Wat dit bewijst

Deze PoC beantwoordt ADR-006 (authenticatie met JWT). Het toont aan dat:

- Een gebruiker kan inloggen en een JWT-token ontvangt
- Het token de rol van de gebruiker bevat (speler / leerkracht / beheerder)
- De server bij elk verzoek het token valideert zonder sessies bij te houden (stateless)
- Endpoints automatisch toegang weigeren aan gebruikers met de verkeerde rol

## Opstarten

```bash
docker stack deploy -f poc.yaml poc
```

Open daarna je browser en ga naar http://localhost:3000

## Stoppen

```bash
docker stack rm poc
```

## Gebruik

1. Kies een gebruiker (speler, leerkracht of beheerder)
2. Klik op "Inloggen" → je ziet het JWT-token en de gedecodeerde inhoud
3. Test de drie endpoints:
   - `/mijn-profiel` → toegankelijk voor iedereen
   - `/voortgang` → alleen leerkracht en beheerder
   - `/levels/beheer` → alleen beheerder

Je ziet live welke verzoeken slagen (groen) en welke geweigerd worden (rood).

## Gebruikers in deze PoC

| Email | Wachtwoord | Rol |
|---|---|---|
| speler@school.be | 1234 | speler |
| leerkracht@school.be | 1234 | leerkracht |
| beheerder@school.be | 1234 | beheerder |

In productie komen deze uit MongoDB.

## JWT-structuur

Een JWT bestaat uit 3 delen, gescheiden door punten:

```
header.payload.signature
```

Het payload-deel bevat:
```json
{
  "id": 1,
  "email": "speler@school.be",
  "rol": "speler",
  "iat": 1234567890,
  "exp": 1234571490
}
```

De server hoeft niets op te slaan — alle informatie zit in het token zelf.
