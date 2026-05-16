# Educatieve Programmeergame — Architectuurdocument

## Inleiding

Een klant wil een educatieve game ontwikkelen waarin spelers leren programmeren door puzzels en levels op te lossen. Denk aan games zoals **CodeCombat** (waar je echte code schrijft om een personage te besturen) of **Lightbot** (waar je visuele blokken sleept om een robot opdrachten te geven).

De belangrijkste eis van de klant is dat **nieuwe levels eenvoudig toegevoegd moeten kunnen worden**, zonder dat de broncode van de applicatie moet aanpassen.

Dit document beschrijft de architectuur die wij voorstellen om dit systeem te bouwen.

---

## 1. Karakteristieken

Dit zijn de 7 belangrijkste kwaliteitseisen voor onze applicatie, gerangschikt op prioriteit.

### 1.1 Security (Veiligheid)

Spelers typen code in die ons systeem uitvoert. Als we die code zonder bescherming uitvoeren, kan een kwaadwillende gebruiker onze server overnemen — bijvoorbeeld door bestanden te lezen, processen te stoppen of data te stelen. Daarom moet alle gebruikerscode in een **sandbox** draaien: een afgesloten omgeving waar de code geen toegang heeft tot de rest van het systeem. Dit is onze belangrijkste karakteristiek omdat het risico bij falen het grootst is.

### 1.2 Extensibility (Uitbreidbaarheid)

De klant vraagt expliciet dat nieuwe levels eenvoudig toegevoegd moeten worden. Dit betekent dat levels niet "ingebakken" mogen zitten in de code van de applicatie. In plaats daarvan definiëren we levels als losse data (bijvoorbeeld JSON-bestanden) die het systeem inlaadt. Zo kan een beheerder een nieuw level toevoegen zonder dat een developer iets moet herprogrammeren.

### 1.3 Performance

Wanneer een speler op "Run" drukt, verwacht die binnen enkele seconden feedback. Als het 10 seconden duurt voordat je ziet of je code werkt, voelt het traag en frustrerend aan. Zeker in een educatieve context — waar leerlingen vaak trial-and-error doen — is snelle feedback essentieel voor het leerproces.

### 1.4 Scalability (Schaalbaarheid)

Stel dat een school met 5 klassen van elk 25 leerlingen dit systeem gebruikt. Dan drukken er potentieel 125 leerlingen tegelijk op "Run". Het systeem moet die piekbelasting aankunnen zonder dat het vastloopt of vertraagt. We moeten dus nadenken over hoe we code-executie verdelen over meerdere servers.

### 1.5 Usability (Gebruiksvriendelijkheid)

Onze doelgroep zijn mensen die leren programmeren — per definitie beginners. De interface moet zo intuïtief zijn dat de tool zelf geen drempel vormt. Foutmeldingen moeten begrijpelijk zijn (niet "SyntaxError at line 12" maar eerder "Je bent een haakje vergeten op regel 12"). De leercurve zit in het programmeren, niet in het leren gebruiken van onze app.

### 1.6 Availability (Beschikbaarheid)

Als een leerkracht dit inplant in een les van 50 minuten en het systeem ligt eruit, dan is die les verloren. Scholen bouwen hun lesplanning rond tools als deze. Daarom moet het systeem een hoge beschikbaarheid hebben.

### 1.7 Testability (Testbaarheid)

Elk level is een puzzel met (minstens) één correcte oplossing. Voordat een level gepubliceerd wordt, moet het systeem kunnen verifiëren dat het level oplosbaar is en dat de validatie correct werkt. Zonder goede testbaarheid riskeren we dat spelers vastlopen op kapotte levels, wat het vertrouwen in het product ondermijnt.

---

## 2. Logische componenten

Hieronder brengen we in kaart welke functionele bouwblokken onze applicatie nodig heeft. Dit doen we **voor** we een architectuurstijl kiezen — deze componenten staan los van technologie.

### 2.1 Actor-Action analyse

We identificeren eerst wie ons systeem gebruikt en wat ze doen:

**Speler:**

- Account aanmaken en inloggen
- Een level kiezen uit de beschikbare levels
- Code schrijven in de editor
- Code uitvoeren en het resultaat bekijken
- Hints opvragen als ze vastzitten
- Hun voortgang en scores bekijken

**Leerkracht:**

- Een klas aanmaken en leerlingen uitnodigen
- Voortgang per leerling bekijken
- Specifieke levels toewijzen aan een klas

**Beheerder:**

- Een nieuw level ontwerpen (grid, puzzel, beschikbare commando's)
- Een level testen voordat het gepubliceerd wordt
- Een level publiceren zodat spelers het kunnen spelen

### 2.2 Componenten en hun taken

Uit de actor-action analyse leiden we de volgende componenten af:

**User Management**

- Registratie en login afhandelen
- Gebruikersrollen beheren (speler, leerkracht, content creator)
- Profielgegevens opslaan en aanpassen

**Game Engine (Frontend)**

- Het speelveld visueel weergeven (grid, personage, obstakels)
- De code-editor tonen waarin spelers hun code schrijven
- Animaties afspelen die het resultaat van de code tonen (personage beweegt, draait, etc.)
- Feedback tonen (level gehaald, foutmelding, hints)

**Code Execution Engine**

- Ingediende code ontvangen
- Code uitvoeren in een beveiligde sandbox
- Het resultaat terugsturen (reeks acties die het personage moet uitvoeren, of een foutmelding)
- Tijdslimiet en geheugenlimiet afdwingen zodat oneindige loops de server niet blokkeren

**Level Management**

- Leveldefinities opslaan en ophalen (uit een databank of bestandssysteem)
- Levels filteren op moeilijkheidsgraad, thema of programmeerconcept
- De volgorde en progressie van levels beheren

**Level Editor**

- Een interface bieden waarmee beheerders levels visueel ontwerpen
- Levels laten testen voor publicatie
- Leveldefinities valideren (is het level oplosbaar? zijn alle velden ingevuld?)

**Progress Tracking**

- Bijhouden welke levels een speler voltooid heeft
- Scores, aantal pogingen en bestede tijd opslaan
- Voortgangsoverzichten genereren voor leerkrachten

**Classroom Management**

- Klassen aanmaken en beheren
- Leerlingen aan klassen koppelen
- Statistieken voor leerkrachten om de vooruitgang van leerlingen te volgen.

---

## 3. ADR: Architecturale stijl

> Referentie formaat: Michael Nygard's ADR template — https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions

### ADR-001: Keuze van architecturale stijl

**Status:** Aanvaard

**Context:**
We bouwen een educatieve programmeergame met een klein team (5 personen) en een deadline van 6 maanden. De applicatie heeft één duidelijk afgebakend domein (een leergame) maar bevat één component dat sterk verschilt van de rest: de code execution engine. De meeste componenten (user management, progress tracking, classroom management) zijn standaard CRUD-functionaliteit. De code execution engine daarentegen heeft speciale eisen rond security en isolatie.

De klant vraagt expliciet dat het systeem eenvoudig uitbreidbaar is met nieuwe levels. Dit wijst op een plug-in-achtig systeem waarbij de kern stabiel blijft en content dynamisch toegevoegd wordt.

**Overwogen stijlen:**

- **Monoliet:** Eén applicatie die alles bevat. Eenvoudig te ontwikkelen en deployen, maar moeilijker om de code execution engine te isoleren voor security. Als de sandbox faalt, ligt de hele applicatie open. Te weinig scheiding.

- **Modulaire monoliet:** Eén applicatie met duidelijk gescheiden modules. Beter dan een gewone monoliet omdat elke module zijn eigen verantwoordelijkheid heeft. Maar de code execution engine deelt nog steeds hetzelfde proces als de rest, wat een security-risico blijft.

- **Microkernel (plug-in architectuur):** Een kern (core) met plug-ins die functionaliteit toevoegen. De kern bevat de game engine en basisfunctionaliteit. Levels worden als plug-ins geladen. Dit past perfect bij de eis van uitbreidbaarheid. De code execution engine kan als apart proces draaien voor isolatie.

- **Microservices:** Elke component wordt een aparte service. Biedt maximale isolatie en schaalbaarheid, maar is veel te complex voor een team van 5 in 6 maanden. De overhead van service discovery, netwerkcommunicatie, gedistribueerde logging en deployment is enorm.

- **Service-based:** Een middenweg tussen monoliet en microservices: een paar grotere services in plaats van vele kleine. Minder overhead dan microservices, maar nog steeds complexer dan nodig voor ons domein.

- **Event-driven:** Componenten communiceren via events. Nuttig voor systemen met veel asynchrone processen, maar onze applicatie is grotendeels request-response (speler drukt op "Run", krijgt resultaat terug). Zou onnodige complexiteit toevoegen.

- **Space-based:** Ontworpen voor extreme schaalbaarheid met in-memory data grids. Totaal overkill voor onze use case.

- **Pipeline:** Data stroomt door een reeks filters/stappen. Past niet goed bij een interactieve game.

**Decision:**
We kiezen voor een **microkernel-architectuur (plug-in architectuur)**.

**Motivatie:**

- Past bij de kerneis: de klant wil dat levels eenvoudig toegevoegd worden. In een microkernel zijn levels plug-ins die dynamisch geladen worden — precies wat de klant vraagt.
- Beheersbare complexiteit: voor een team van 5 in 6 maanden is een microkernel realistisch. Het is in essentie een modulaire applicatie met een duidelijk plug-in mechanisme, geen gedistribueerd systeem.
- Security: de code execution engine kan als apart proces draaien (een soort "externe plug-in"), wat betere isolatie biedt dan een gewone monoliet.
- Bekende aanpak: veel applicaties met plug-in systemen gebruiken deze architectuur (denk aan VS Code, Eclipse, WordPress).

Onze tweede keuze zou een **service-based architectuur** zijn. Hierbij zouden we de code execution engine als aparte service draaien (voor security-isolatie) en de rest als één grotere service. Dit zou betere fysieke isolatie bieden, maar introduceert netwerkcommunicatie tussen services, wat de complexiteit verhoogt. Met een groter team en meer tijd zou dit een betere keuze zijn.

**Consequences:**

### Positief

- Levels kunnen toegevoegd worden als losse plug-ins, zonder aanpassingen aan de kerncode.
- De code execution engine kan als geïsoleerd proces draaien, wat de security verbetert.
- Beheersbare architectuurcomplexiteit voor een klein team binnen de gegeven tijdslijn.
- Aansluit bij bekende en goed gedocumenteerde patroon (VS Code, Eclipse, WordPress).

### Negatief

- Vereist een goed gedefinieerde plug-in interface waaraan elk level moet voldoen.
- Het dynamisch laden van plug-ins introduceert extra complexiteit in het laadmechanisme.
- Bij groei van het systeem kan de microkernel aanpak beperkingen vertonen op het vlak van schaalbaarheid.

**Governance:**

- Elk nieuw level moet voldoen aan de gedefinieerde plug-in interface; afwijkingen worden geblokkeerd bij validatie.
- De kerncode mag niet afhankelijk zijn van specifieke levelimplementaties; koppeling verloopt uitsluitend via de plug-in interface.
- Tijdens code reviews wordt gecontroleerd dat nieuwe functionaliteit correct als plug-in is geïmplementeerd en de kern niet rechtstreeks aanpast.

**Notes:**

Bronnen:

- https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- https://github.com/chapin666/books/blob/master/architecture/software-architecture-patterns.pdf
- https://code.visualstudio.com/api/get-started/extension-anatomy
- https://pure.rug.nl/ws/portalfiles/portal/2724654/c3.pdf

---

## 4. Bijkomende ADR's

### ADR-002: Code-executie en sandboxing

**Status:** Aanvaard

**Context:**
Spelers schrijven code die ons systeem moet uitvoeren. Dit is het grootste security-risico van onze applicatie. We moeten een manier vinden om willekeurige code veilig uit te voeren, zonder dat die code toegang heeft tot ons bestandssysteem, netwerk of andere processen.

**Overwogen opties:**

- **Directe uitvoering op de server:** Code rechtstreeks uitvoeren op dezelfde server als de applicatie. Extreem onveilig — één kwaadaardig commando kan de hele server compromitteren.

- **Docker containers:** Elke code-uitvoering draait in een wegwerp-container met beperkte rechten, geen netwerktoegang en limieten op CPU/geheugen. Na uitvoering wordt de container verwijderd.

- **WebAssembly (WASM) sandbox:** Code compileren naar WebAssembly en uitvoeren in een WASM runtime. Zeer goede isolatie, maar beperkte taalondersteuning en complexer op te zetten.

- **Uitvoering in de browser:** Code uitvoeren in de browser van de speler via een JavaScript interpreter. Geen server-side risico, maar beperkt tot JavaScript en moeilijker te controleren.

**Decision:**
We kiezen voor **Docker containers** als sandbox.

**Motivatie:**

- Docker biedt sterke isolatie: elke uitvoering draait in een eigen container met eigen bestandssysteem.
- We kunnen CPU-limieten, geheugenlimieten en tijdslimieten instellen, waardoor oneindige loops of geheugenbommen de server niet beïnvloeden.
- Docker is een technologie die we kennen uit de lessen, waardoor de leercurve beheersbaar is.
- We ondersteunen meerdere programmeertalen door simpelweg verschillende Docker images te voorzien (Python, JavaScript, etc.).

**Consequences:**

### Positief

- Sterke isolatie per uitvoering: een gecompromitteerde container heeft geen toegang tot de rest van het systeem.
- CPU-, geheugen- en tijdslimieten beschermen de server tegen misbruik of oneindige loops.
- Ondersteuning voor meerdere programmeertalen via aparte Docker images.
- Wegwerp-containers zorgen voor een schone staat bij elke uitvoering.

### Negatief

- Het opstarten van een Docker container introduceert latency (typisch 0,5–2 seconden per uitvoering).
- Vereist beheer van Docker images per ondersteunde programmeertaal.
- Bij hoge belasting (veel gelijktijdige uitvoeringen) is extra infrastructuur nodig om containers te schalen.

**Governance:**

- Elke container draait zonder netwerktoegang (`--network=none`) en met een read-only bestandssysteem.
- De tijdslimiet per uitvoering is maximaal 5 seconden; containers die dit overschrijden worden automatisch gestopt.
- Nieuwe programmeertalen mogen alleen toegevoegd worden via een goedgekeurd Docker image dat voldoet aan de beveiligingsrichtlijnen.

**Notes:**

Bronnen:

- https://docs.docker.com/engine/security/
- https://www.docker.com/blog/how-to-use-the-node-docker-official-image/
- https://github.com/apocas/dockerode

---

### ADR-003: Levelformaat en -opslag

**Status:** Aanvaard

**Context:**
Levels moeten eenvoudig toe te voegen zijn. We moeten kiezen hoe we levels definiëren (welk formaat) en waar we ze opslaan.

**Overwogen opties:**

- **Hardcoded in de broncode:** Levels zitten als code in de applicatie. Eenvoudig maar vereist een developer en herdeployment voor elk nieuw level. Gaat rechtstreeks in tegen de eis van de klant.

- **JSON-bestanden:** Levels worden beschreven als JSON-bestanden met een vast schema (grid, startpositie, doelpositie, beschikbare commando's, validatieregels). Leesbaar, makkelijk te bewerken en te valideren.

- **Database (relationeel):** Levels opslaan in een SQL-database. Krachtig voor zoeken en filteren, maar een level is een complex geheel dat beter als één document past dan verspreid over meerdere tabellen.

- **Database (document-based, bv. MongoDB):** Levels opslaan als JSON-documenten in een documentdatabase. Combineert de flexibiliteit van JSON met de query-mogelijkheden van een database.

**Decision:**
We kiezen voor **JSON-bestanden met een vast schema**, opgeslagen in een **document-database (MongoDB)**.

**Motivatie:**

- Een level is van nature een document: het bevat een grid, regels, metadata en validatie — dat past goed in één JSON-object.
- MongoDB slaat JSON-documenten op en laat ons toe om te zoeken op velden zoals moeilijkheidsgraad of thema.
- Content creators kunnen levels ontwerpen in de level editor, die een JSON-document genereert en opslaat in de database.
- We definiëren een JSON-schema dat beschrijft welke velden verplicht zijn. Zo kunnen we elk nieuw level valideren voordat het opgeslagen wordt.

**Consequences:**

### Positief

- Levels zijn zelfstandige, leesbare documenten die eenvoudig te inspecteren en te bewerken zijn.
- MongoDB maakt efficiënt filteren op metadata mogelijk (moeilijkheidsgraad, thema, programmeerconcept).
- Het JSON-schema biedt een duidelijk contract voor de level editor en het laadmechanisme.
- Geen herdeployment nodig bij het toevoegen van nieuwe levels.

### Negatief

- Vereist het ontwerp en onderhoud van een JSON-schema dat up-to-date blijft naarmate levels complexer worden.
- MongoDB biedt minder sterke transactiegaranties dan een relationele database, wat bij gelijktijdige schrijfoperaties aandacht vereist.
- Complexe queries over meerdere levelvelden kunnen minder performant zijn dan in een relationele database.

**Governance:**

- Elk nieuw level moet gevalideerd worden tegen het JSON-schema alvorens het opgeslagen wordt in de database.
- Wijzigingen aan het JSON-schema worden behandeld als breaking changes en vereisen migratie van bestaande leveldocumenten.
- De level editor is de enige geautoriseerde manier om levels aan te maken of te bewerken; directe database-aanpassingen zijn niet toegestaan in productie.

**Notes:**

Bronnen:

- https://www.mongodb.com/docs/manual/
- https://json-schema.org/
- https://www.mongodb.com/developer/languages/javascript/node-connect-mongodb/

#### Uitbreiding: Schema Evolution bij document-gebaseerde databases

Wanneer het levelformaat evolueert — bijvoorbeeld omdat er nieuwe velden 
toegevoegd worden — riskeren bestaande levels in de database incompatibel 
te worden met het nieuwe schema. Dit probleem heet schema evolution en is 
een gekend architecturaal aandachtspunt bij document-gebaseerde databases 
zoals MongoDB.

Een veelgebruikte oplossing is het toevoegen van een versienveld aan elk 
document. Het systeem detecteert de versie bij het laden en past indien 
nodig een migratielogica toe. Dit patroon heet lazy migration: documenten 
worden pas gemigreerd wanneer ze effectief geladen worden, in plaats van 
een grote eenmalige migratie.

In ons systeem zou dit betekenen dat elk leveldocument een veld 
`schemaVersion` krijgt. Bij het laden controleert het systeem de versie 
en valideert het level tegen het juiste schema.

Bron: https://www.mongodb.com/blog/post/building-with-patterns-the-schema-versioning-pattern

---

### ADR-004: Frontend technologie

**Status:** Aanvaard

**Context:**
We moeten een interactieve game-interface bouwen met een code-editor, een visueel speelveld met animaties, en diverse dashboards (voortgang, classroom management).

**Overwogen opties:**

- **Server-side rendering (bv. traditioneel PHP/HTML):** Pagina's worden op de server gegenereerd. Niet geschikt voor een interactieve game die real-time feedback en animaties nodig heeft.

- **React:** Populair JavaScript-framework met een enorm ecosysteem. Component-based, wat past bij onze modulaire opzet. Veel beschikbare bibliotheken voor code-editors (Monaco, CodeMirror) en canvas/animaties.

- **Vue.js:** Vergelijkbaar met React maar met een minder steile leercurve. Kleiner ecosysteem maar voldoende voor onze noden.

- **Unity/Godot (game engine):** Krachtig voor games, maar overkill voor wat in essentie een puzzelgame met een code-editor is. Bovendien moeilijker te integreren met web-based componenten zoals classroom management.

**Decision:**
We kiezen voor **React**.

**Motivatie:**

- React is component-based, wat aansluit bij onze microkernel-gedachte: elk scherm of feature is een component.
- Er bestaan uitstekende open-source code-editors voor React, zoals Monaco Editor (dezelfde editor als VS Code).
- We kunnen het visuele speelveld bouwen met HTML5 Canvas of een library als Phaser.js, die goed integreert met React.
- React is de technologie waar het meeste documentatie en community support voor bestaat, wat belangrijk is voor ons als team dat nog leert.

**Consequences:**

### Positief

- Component-based opzet maakt hergebruik en onafhankelijke ontwikkeling van UI-onderdelen mogelijk.
- Groot ecosysteem met mature bibliotheken voor code-editors, canvas-rendering en state management.
- Één JavaScript-taal over frontend en backend vermindert context-switching binnen het team.
- Grote community en uitgebreide documentatie ondersteunen het leerproces van het team.

### Negatief

- React introduceert een leercurve voor teamleden zonder voorafgaande ervaring.
- Een Single Page Application vereist extra aandacht voor SEO en initiële laadtijd.
- De afhankelijkheid van externe npm-packages brengt risico's mee op het vlak van onderhoud en beveiliging.

**Governance:**

- Nieuwe UI-functionaliteit wordt geïmplementeerd als React-component; losse JavaScript-bestanden buiten de componentstructuur zijn niet toegestaan.
- Monaco Editor is de standaard voor alle code-invoervelden; alternatieve editors mogen niet worden toegevoegd zonder teambeslissing.
- Tijdens code reviews wordt gecontroleerd dat businesslogica niet rechtstreeks in de frontend terechtkomt maar via de backend API verloopt.

**Notes:**

Bronnen:

- https://react.dev/
- https://microsoft.github.io/monaco-editor/
- https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- https://phaser.io/

---

### ADR-005: Backend platform en REST API

**Status:** Aanvaard

**Context:**
We hebben een backend nodig die API-endpoints aanbiedt voor de frontend, communiceert met de database, authenticatie afhandelt, en de code execution engine aanstuurt.

De backend moet:

- JSON-data verwerken tussen frontend en database
- Docker containers kunnen aansturen voor code-executie
- Eenvoudig uitbreidbaar blijven
- Goed samenwerken met een React frontend

**Overwogen opties:**

- **Node.js (Express/Fastify):** JavaScript op de server. Voordeel: dezelfde taal als de frontend (React). Lichtgewicht, event-driven en snel op te zetten.

- **Python (Django/Flask/FastAPI):** Veel libraries en populair voor educatieve toepassingen. Introduceert echter een tweede programmeertaal in het project.

- **Java (Spring Boot):** Zeer robuust en geschikt voor enterprise toepassingen, maar complexer en zwaarder voor een klein team met beperkte tijd.

- **C# (.NET):** Sterke tooling en typeveiligheid, maar minder natuurlijke integratie met een JavaScript-gebaseerde frontend stack.

**Decision:**
We kiezen voor **Node.js met Express** als backendplatform en bouwen een REST API voor communicatie tussen frontend en backend.

**Motivatie:**

- Dezelfde taal (JavaScript/TypeScript) voor frontend en backend vermindert context-switching binnen het team.
- Express is minimalistisch en laat snelle ontwikkeling van API-endpoints toe.
- Node.js heeft een event-driven architectuur die goed past bij I/O-intensieve toepassingen zoals API-verkeer en Docker-aansturing.
- De JSON-communicatie tussen frontend, backend en MongoDB sluit natuurlijk aan bij de JavaScript-stack.
- Node.js beschikt over mature libraries voor Docker-integratie, zoals Dockerode.

**Consequences:**

### Positief

- Eén uniforme programmeertaal over de volledige stack.
- Snelle ontwikkeling en lage instapdrempel.
- Goede integratie met MongoDB en Docker.

### Negatief

- Minder geschikt voor CPU-intensieve taken.
- Typeveiligheid vereist extra tooling zoals TypeScript.
- Grote afhankelijkheid van externe npm-packages.

**Governance:**

- Nieuwe backendfunctionaliteit wordt toegevoegd via REST-endpoints tenzij realtime communicatie expliciet vereist is.
- API-endpoints worden gedocumenteerd zodat frontend en backend consistent blijven.
- Tijdens code reviews wordt gecontroleerd dat businesslogica niet rechtstreeks in de frontend terechtkomt.

**Notes:**

Bronnen:

- https://expressjs.com/
- https://nodejs.org/en
- https://www.docker.com/blog/how-to-use-the-node-docker-official-image/
- https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs/Introduction

---

### ADR-006: Authenticatie en autorisatie

**Status:** Aanvaard

**Context:**
We hebben drie gebruikersrollen (speler, leerkracht, content creator) die elk andere rechten hebben. We moeten gebruikers kunnen identificeren en hun toegang beperken tot de juiste functionaliteit.

**Overwogen opties:**

- **Session-based authenticatie:** Server houdt sessies bij in het geheugen of een database. Eenvoudig maar schaalt minder goed.

- **JWT (JSON Web Tokens):** Na het inloggen krijgt de gebruiker een token dat bij elk verzoek meegestuurd wordt. Stateless — de server hoeft geen sessies bij te houden. Past goed bij een REST API.

- **OAuth2 / externe provider (Google, Microsoft):** Uitbesteden van authenticatie aan een externe partij. Handig voor scholen die al Google of Microsoft accounts hebben, maar complexer om op te zetten.

**Decision:**
We kiezen voor **JWT-authenticatie**, met de mogelijkheid om later OAuth2 toe te voegen.

**Motivatie:**

- JWT is stateless en past bij onze REST API: elk request bevat het token, de server hoeft geen sessieopslag bij te houden.
- Het token bevat de rol van de gebruiker (speler/leerkracht/content creator), waardoor we autorisatie eenvoudig kunnen afdwingen.
- JWT is een standaard die goed gedocumenteerd is en waarvoor veel libraries bestaan in Node.js.
- We houden de deur open voor OAuth2 als toekomstige uitbreiding, wat voor scholen met Google/Microsoft accounts erg handig zou zijn.

**Consequences:**

### Positief

- Stateless authenticatie past naadloos bij de REST API en vereenvoudigt horizontale schaalverdeling.
- Gebruikersrol zit ingebakken in het token, waardoor autorisatiecontroles eenvoudig en snel zijn.
- Breed gedocumenteerde standaard met mature Node.js libraries (bijv. jsonwebtoken).
- Uitbreidbaar naar OAuth2 zonder de bestaande authenticatielaag te herbouwen.

### Negatief

- Tokens kunnen niet onmiddellijk ingetrokken worden na uitgifte (tenzij via een blacklist-mechanisme).
- Bij een gelekt token heeft een aanvaller toegang tot de geldigheidsduur van het token.
- Tokenbeheer (vervaldatum, vernieuwing) vereist extra aandacht aan de frontend-zijde.

**Governance:**

- Bij het inloggen genereert de server een JWT met daarin de gebruikers-ID en rol; de geldigheidsduur is maximaal 24 uur.
- De frontend stuurt het token mee in de `Authorization` header van elk HTTP-verzoek; opslag in `localStorage` is niet toegestaan (gebruik `httpOnly` cookies).
- Tijdens code reviews wordt gecontroleerd dat alle beveiligde endpoints de rol uit het token valideren alvorens een actie uit te voeren.

**Notes:**

Bronnen:

- https://jwt.io/introduction
- https://www.npmjs.com/package/jsonwebtoken
- https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
- https://oauth.net/2/

---

### ADR-007: Real-time communicatie via WebSockets

**Status:** Aanvaard

**Context:**
Leerkrachten moeten in real-time kunnen volgen hoe leerlingen vorderen tijdens het spelen van levels. Wanneer een leerling een level voltooit of nieuwe score behaalt, moet deze informatie onmiddellijk zichtbaar zijn op het dashboard van de leerkracht.

Een traditionele request-response aanpak via REST zou vereisen dat de frontend voortdurend de backend bevraagt via polling. Dit veroorzaakt onnodige netwerkverzoeken en verhoogt de latency tussen een gebeurtenis en de zichtbare update.

We hebben daarom een mechanisme nodig waarmee de server actief updates naar verbonden clients kan pushen.

**Overwogen opties:**

- **REST polling:** De frontend vraagt periodiek nieuwe data op via HTTP-requests. Eenvoudig te implementeren, maar inefficiënt door veel onnodige requests.

- **Long polling:** De server houdt een request open tot er nieuwe data beschikbaar is. Minder requests dan gewone polling, maar complexer en minder schaalbaar.

- **Server-Sent Events (SSE):** Laat de server updates sturen naar de client via een eenrichtingsverbinding. Geschikt voor server → client communicatie, maar niet voor bidirectionele interactie.

- **WebSockets:** Permanente bidirectionele verbinding tussen client en server. Lage latency en geschikt voor real-time updates.

**Decision:**
We kiezen voor **WebSockets** via **Socket.IO** voor real-time communicatie tussen backend en frontend.

**Motivatie:**

- WebSockets maken onmiddellijke server → client updates mogelijk zonder polling.
- De verbinding blijft open, waardoor latency laag blijft.
- Socket.IO vereenvoudigt reconnectie, fallback-mechanismen en event-based communicatie.
- De oplossing past goed bij dashboards waarop meerdere gebruikers tegelijk verbonden zijn.

**Consequences:**

### Positief

- Real-time updates zonder pagina-refresh.
- Minder netwerkoverhead dan frequente polling.
- Responsievere gebruikerservaring voor leerkrachten.
- Eenvoudige implementatie van live dashboards en notificaties.

### Negatief

- Complexere connectiestatus en sessiebeheer.
- Extra schaalbaarheidsuitdagingen bij veel gelijktijdige verbindingen.
- Vereist bijkomende infrastructuur bij horizontale schaalverdeling (bijvoorbeeld Redis pub/sub).

**Governance:**

- WebSockets worden enkel gebruikt voor realtime functionaliteit zoals voortgangsupdates en live notificaties.
- Gewone CRUD-operaties blijven verlopen via de REST API.
- Tijdens code reviews wordt gecontroleerd dat realtime events correct gevalideerd en gelogd worden.

**Notes:**

Bronnen:

- https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
- https://socket.io/docs/v4/
- https://blog.postman.com/how-do-websockets-work/
- https://dev.to/imsushant12/real-time-communication-with-websockets-and-socketio-in-nodejs-4p8e

---

## 5. C4-diagrammen

Hieronder de Structurizr-broncode voor onze C4-diagrammen.

### 5.1 System Context Diagram

Dit diagram toont ons systeem vanuit vogelperspectief: wie gebruikt het en welke externe systemen zijn er?

```structurizr
workspace {
    model {
        speler = person "Speler" "Leert programmeren door puzzels op te lossen"
        leerkracht = person "Leerkracht" "Beheert klassen en volgt voortgang van leerlingen"
        beheerder = person "Beheerder" "Ontwerpt en publiceert nieuwe levels"

        educatieveGame = softwareSystem "Educatieve Programmeergame" "Laat spelers programmeren leren via puzzels en levels"

        speler -> educatieveGame "Speelt levels, schrijft code, bekijkt voortgang"
        leerkracht -> educatieveGame "Beheert klassen, bekijkt voortgangsrapporten"
        beheerder -> educatieveGame "Ontwerpt en publiceert nieuwe levels"
    }

    views {
        systemContext educatieveGame "SystemContext" {
            include *
            autolayout lr
        }
    }
}
```

### 5.2 Container Diagram

Dit diagram zoomt in op ons systeem en toont de grote technische bouwblokken (containers) en hoe ze communiceren.

Dit diagram toont ook de microkernel-structuur: de Backend API is de kern (core), en de Level Plug-ins zijn de plug-ins die dynamisch geladen worden. Nieuwe levels toevoegen vereist geen aanpassing aan de kern.

```structurizr
workspace {
    model {
        speler = person "Speler"
        leerkracht = person "Leerkracht"
        beheerder = person "Beheerder"

        educatieveGame = softwareSystem "Educatieve Programmeergame" {
            frontend = container "Frontend (React SPA)" "Biedt de game-interface, code-editor en dashboards" "React, Monaco Editor"
            backend = container "Backend API" "Verwerkt verzoeken, beheert logica en stuurt code-executie aan" "Node.js, Express"
            codeEngine = container "Code Execution Engine" "Voert gebruikerscode veilig uit in Docker containers" "Docker, Node.js"
            database = container "Database" "Slaat gebruikers, levels, voortgang en klassen op" "MongoDB"
            levelPlugins = container "Level Plug-ins" "JSON-gedefinieerde levels die dynamisch geladen worden als plug-ins" "JSON, MongoDB"
        }

        speler -> frontend "Gebruikt" "HTTPS"
        leerkracht -> frontend "Gebruikt" "HTTPS"
        beheerder -> frontend "Gebruikt" "HTTPS"

        frontend -> backend "Stuurt verzoeken" "JSON/HTTPS"
        backend -> database "Leest en schrijft data" "MongoDB Driver"
        backend -> codeEngine "Stuurt code ter uitvoering" "Docker API"
        backend -> levelPlugins "Laadt levels dynamisch" "JSON Schema validatie"
    }

    views {
        container educatieveGame "Containers" {
            include *
            autolayout lr
        }
    }
}
```

### 5.3 Deployment Diagram

Dit diagram toont hoe de applicatie gedeployed wordt op een Docker Swarm cluster.

```structurizr
workspace {
    model {
        educatieveGame = softwareSystem "Educatieve Programmeergame" {
            frontend = container "Frontend (React SPA)"
            backend = container "Backend API"
            codeEngine = container "Code Execution Engine"
            database = container "Database"
        }

        productie = deploymentEnvironment "Productie" {
            deploymentNode "Docker Swarm Cluster" {
                deploymentNode "Manager Node" {
                    deploymentNode "Nginx" {
                        frontendInstance = containerInstance frontend
                    }
                    deploymentNode "Backend Service" {
                        backendInstance = containerInstance backend
                    }
                }
                deploymentNode "Worker Nodes" {
                    deploymentNode "Code Sandbox" {
                        codeEngineInstance = containerInstance codeEngine
                    }
                }
                deploymentNode "Database Node" {
                    deploymentNode "MongoDB Server" {
                        databaseInstance = containerInstance database
                    }
                }
            }
        }
    }

    views {
        deployment educatieveGame "Productie" "Deployment" {
            include *
            autolayout lr
        }
    }
}
```

---

## 6. Proofs of Concept

We werken 5 Proofs of Concept uit, elk in een eigen directory. Hieronder een korte beschrijving van elke PoC en welke technische vraag die beantwoordt. De volledige code en instructies staan in de respectievelijke mappen.

### PoC 1: Sandboxed Code Execution (`poc-1-sandbox/`)

**Technische vraag:** Kunnen we gebruikerscode veilig uitvoeren in een Docker container met CPU-, geheugen- en tijdslimieten?

We bouwen een klein programma dat:

- Een stuk Python-code ontvangt via een webinterface
- Een Docker container opstart met die code
- De container draait zonder netwerktoegang, met een tijdslimiet van 5 seconden en een geheugenlimiet van 64MB
- Het resultaat (output of foutmelding) teruggeeft
- De container na uitvoering automatisch verwijdert

### PoC 2: Level laden als plug-in (`poc-2-levels/`)

**Technische vraag:** Kunnen we levels definiëren als JSON-documenten en die dynamisch laden en valideren, zonder de applicatiecode aan te passen?

We bouwen een klein programma dat:

- Een JSON-schema definieert voor levels
- Meerdere voorbeeldlevels bevat als JSON-bestanden
- De levels inlaadt, valideert tegen het schema, en simuleert
- Een ongeldig level correct afwijst

### PoC 3: Code-editor met visuele feedback (`poc-3-editor/`)

**Technische vraag:** Kunnen we een code-editor integreren die bij het uitvoeren een visueel resultaat toont (een personage dat beweegt op een grid)?

We bouwen een minimale webpagina met:

- Monaco Editor voor code-invoer
- Een canvas dat een grid toont met een personage
- Wanneer de speler code uitvoert, beweegt het personage stap voor stap op basis van de commando's
- Het level wordt geladen uit een JSON-bestand volgens ons levelformaat

### PoC 4: Real-time voortgang synchronisatie (`poc-4-real-time-voortgang/`)

**Technische vraag:** Kan een leerkracht in real-time zien hoe leerlingen vorderen, zonder constant de pagina te moeten verversen?

We bouwen een klein systeem met:

- Een WebSocket-server die voortgangswijzigingen bijhoudt
- Een teacher-dashboard dat live updates ontvangt via Socket.IO
- Een student-simulator die meerdere leerlingen simuleert die tegelijk levels voltooien

### PoC 5: Authenticatie en autorisatie (`poc-5-authenticatie/`)

**Technische vraag:** Kunnen we met JWT-authenticatie verschillende gebruikersrollen (speler, leerkracht, beheerder) onderscheiden en toegang tot API-endpoints beperken op basis van die rol?

We bouwen een klein systeem met:

- Een login-endpoint dat een JWT genereert met daarin de gebruikersrol
- Middleware die het token controleert bij elk verzoek
- Rolgebaseerde toegangscontrole: bepaalde endpoints zijn alleen toegankelijk voor specifieke rollen
- Een webinterface om in te loggen als verschillende gebruikers en de toegangscontrole te testen
