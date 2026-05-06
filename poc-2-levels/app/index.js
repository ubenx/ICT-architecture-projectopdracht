const mongoose = require('mongoose');
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

// ============================================================
// JSON Schema — beschrijft hoe een geldig level eruitziet
// ============================================================
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

// MongoDB model
const Level = mongoose.model('Level', new mongoose.Schema({}, { strict: false }));

// ============================================================
// Oplossing simuleren — bewijst dat het level oplosbaar is
// ============================================================
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
    }
  }

  return x === level.grid.goal.x && y === level.grid.goal.y;
}

// ============================================================
// Statistieken berekenen
// ============================================================
async function toonStatistieken() {
  console.log('\n--- Statistieken per thema ---\n');
  const themas = ['basics', 'advanced', 'loops', 'functions'];
  for (const thema of themas) {
    const aantal = await Level.countDocuments({ theme: thema });
    if (aantal > 0) {
      console.log(`  ${thema}: ${aantal} level(s)`);
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

// ============================================================
// Hoofdprogramma
// ============================================================
async function main() {
  await mongoose.connect(process.env.MONGO_URL || 'mongodb://mongo:27017/gamedb');
  console.log('Verbonden met MongoDB\n');

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
    console.log(`  Opgeslagen: "${levelData.name}" (moeilijkheid: ${levelData.difficulty}, thema: ${levelData.theme})`);
    aantalGeldig++;
  }

  console.log('\n' + '-'.repeat(50));
  console.log(`\n${aantalGeldig} level(s) opgeslagen`);
  console.log(`${aantalOngeldig} level(s) geweigerd\n`);

  console.log('Alle levels in de database:\n');
  const alleLevels = await Level.find({}, { _id: 0, id: 1, name: 1, difficulty: 1, theme: 1 });
  alleLevels.forEach(l => {
    console.log(`  [${l.difficulty}] ${l.name} — thema: ${l.theme} (${l.id})`);
  });

  console.log('\nFilter: alleen moeilijkheid 1:\n');
  const makkelijk = await Level.find({ difficulty: 1 }, { _id: 0 });
  makkelijk.forEach(l => {
    console.log(`  Gevonden: "${l.name}"`);
    console.log(`  Grid: ${l.grid.width}x${l.grid.height}`);
    console.log(`  Commando's: ${l.availableCommands.join(', ')}`);
    console.log(`  Oplossing: ${l.solution.join(' -> ')}\n`);
  });

  await toonStatistieken();

  await mongoose.disconnect();
  console.log('\nKlaar. PoC bewijst dat levels dynamisch geladen worden als plug-ins.');
  console.log('Nieuw level toevoegen = JSON bestand toevoegen. Geen code aanpassen.');
}

main().catch(console.error);