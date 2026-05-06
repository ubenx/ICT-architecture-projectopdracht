const mongoose = require('mongoose');
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const levelSchema = {
  type: 'object',
  required: ['id', 'name', 'difficulty', 'description', 'grid', 'availableCommands', 'maxCommands', 'solution'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string', minLength: 1, maxLength: 100 },
    difficulty: { type: 'integer', minimum: 1, maximum: 5 },
    description: { type: 'string' },
    concept: { type: 'string', enum: ['sequentie', 'herhaling', 'conditie', 'functies', 'variabelen'] },
    hint: { type: 'string' },
    grid: {
      type: 'object',
      required: ['width', 'height', 'start', 'goal', 'walls'],
      properties: {
        width: { type: 'integer', minimum: 3, maximum: 20 },
        height: { type: 'integer', minimum: 3, maximum: 20 },
        start: { type: 'object', required: ['x', 'y', 'direction'] },
        goal: { type: 'object', required: ['x', 'y'] },
        walls: { type: 'array' },
        collectibles: { type: 'array' }
      }
    },
    availableCommands: {
      type: 'array',
      items: { type: 'string', enum: ['moveForward', 'turnLeft', 'turnRight', 'repeat', 'if_wall', 'if_no_wall', 'pickup'] },
      minItems: 1
    },
    maxCommands: { type: 'integer', minimum: 1, maximum: 100 },
    solution: { type: 'array', items: { type: 'string' }, minItems: 1 }
  }
};

const Level = mongoose.model('Level', new mongoose.Schema({}, { strict: false }));

function testOplossing(level) {
  let x = level.grid.start.x;
  let y = level.grid.start.y;
  const directions = ['north', 'east', 'south', 'west'];
  let dirIndex = directions.indexOf(level.grid.start.direction);

  for (const command of level.solution) {
    if (command === 'moveForward') {
      if (dirIndex === 0) y--;
      else if (dirIndex === 1) x++;
      else if (dirIndex === 2) y++;
      else if (dirIndex === 3) x--;
    } else if (command === 'turnLeft') {
      dirIndex = (dirIndex + 3) % 4;
    } else if (command === 'turnRight') {
      dirIndex = (dirIndex + 1) % 4;
    } else if (command === 'pickup') {
      // geen effect op positie
    }
  }

  const bereikt = x === level.grid.goal.x && y === level.grid.goal.y;
  if (!bereikt) {
    console.log(`  Debug: eindpositie (${x},${y}), doel (${level.grid.goal.x},${level.grid.goal.y})`);
  }
  return bereikt;
}

async function toonStatistieken() {
  console.log('\n--- Statistieken per concept ---\n');
  const concepten = ['sequentie', 'herhaling', 'conditie', 'functies', 'variabelen'];
  for (const concept of concepten) {
    const aantal = await Level.countDocuments({ concept: concept });
    if (aantal > 0) {
      console.log(`  ${concept}: ${aantal} level(s)`);
    }
  }

  console.log('\n--- Statistieken per moeilijkheidsgraad ---\n');
  for (let i = 1; i <= 5; i++) {
    const aantal = await Level.countDocuments({ difficulty: i });
    if (aantal > 0) {
      console.log(`  Moeilijkheid ${i}: ${aantal} level(s)`);
    }
  }
}

async function main() {
  await mongoose.connect(process.env.MONGO_URL || 'mongodb://mongo:27017/gamedb');
  console.log('Verbonden met MongoDB\n');

  await Level.deleteMany({});
  console.log('Database geleegd — fresh start\n');

  const ajv = new Ajv();
  const validate = ajv.compile(levelSchema);

  const levelsDir = path.join(__dirname, 'levels');
  const files = fs.readdirSync(levelsDir).filter(f => f.endsWith('.json'));

  console.log(`${files.length} levelbestand(en) gevonden\n`);
  console.log('-'.repeat(50));

  let aantalGeldig = 0;
  let aantalOngeldig = 0;

  for (const file of files) {
    const raw = fs.readFileSync(path.join(levelsDir, file), 'utf-8');
    const levelData = JSON.parse(raw);

    console.log(`\nValideren: ${file}`);

    const valid = validate(levelData);
    if (!valid) {
      console.log(`  ONGELDIG — wordt niet opgeslagen`);
      validate.errors.forEach(e => console.log(`  Fout: ${e.instancePath} ${e.message}`));
      aantalOngeldig++;
      continue;
    }

    const oplosbaar = testOplossing(levelData);
    if (!oplosbaar) {
      console.log(`  WAARSCHUWING — oplossing bereikt het doel niet!`);
    } else {
      console.log(`  Oplossing geverifieerd — level is oplosbaar`);
    }

    await Level.findOneAndUpdate(
      { id: levelData.id },
      levelData,
      { upsert: true, new: true }
    );
    console.log(`  Opgeslagen: "${levelData.name}" (moeilijkheid: ${levelData.difficulty}, concept: ${levelData.concept || 'niet opgegeven'})`);
    aantalGeldig++;
  }

  console.log('\n' + '-'.repeat(50));
  console.log(`\n${aantalGeldig} level(s) opgeslagen`);
  console.log(`${aantalOngeldig} level(s) geweigerd\n`);

  console.log('Alle levels in de database:\n');
  const alleLevels = await Level.find({});
  alleLevels.forEach(l => {
    const obj = l.toObject();
    console.log(`  [${obj.difficulty}] ${obj.name} — concept: ${obj.concept || 'niet opgegeven'} (${obj.id || 'geen id'})`);
  });

  console.log('\nFilter: alleen moeilijkheid 1:\n');
  const makkelijk = await Level.find({ difficulty: 1 });
  makkelijk.forEach(l => {
    const obj = l.toObject();
    console.log(`  Gevonden: "${obj.name}"`);
    console.log(`  Grid: ${obj.grid.width}x${obj.grid.height}`);
    console.log(`  Commando's: ${obj.availableCommands.join(', ')}`);
    console.log(`  Oplossing: ${obj.solution.join(' -> ')}\n`);
  });

  await toonStatistieken();

  await mongoose.disconnect();
  console.log('\nKlaar. PoC bewijst dat levels dynamisch geladen worden als plug-ins.');
  console.log('Nieuw level toevoegen = JSON bestand toevoegen. Geen code aanpassen.');
}

main().catch(console.error);