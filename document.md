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
- Statestieken voor leerkrachten om de vooruitgang van leerlingen te volgen.

---