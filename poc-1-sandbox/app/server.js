const express = require('express');
const Docker = require('dockerode');
const path = require('path');

const app = express();
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ══════════════════════════════════════════════
// CONFIGURATIE
// ══════════════════════════════════════════════
const CONFIG = {
    image: 'python:3-alpine',       // Docker image voor Python
    timeoutSeconds: 5,              // Maximale uitvoeringstijd
    memoryLimitMB: 64,              // Maximaal geheugen
    maxOutputLength: 10000,         // Maximale output lengte in karakters
};

// ══════════════════════════════════════════════
// PYTHON IMAGE VOORAF DOWNLOADEN
// ══════════════════════════════════════════════
async function pullImage() {
    try {
        console.log(`Python image "${CONFIG.image}" wordt gedownload...`);
        await new Promise((resolve, reject) => {
            docker.pull(CONFIG.image, (err, stream) => {
                if (err) return reject(err);
                docker.modem.followProgress(stream, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });
        console.log('Python image is klaar.');
    } catch (err) {
        console.error('Fout bij downloaden van image:', err.message);
    }
}

// ══════════════════════════════════════════════
// CODE UITVOEREN IN SANDBOX
// ══════════════════════════════════════════════
async function executeCode(code) {
    const startTime = Date.now();

    // Container aanmaken met strikte beperkingen
    const container = await docker.createContainer({
        Image: CONFIG.image,
        Cmd: ['python3', '-c', code],
        // Geen netwerktoegang
        NetworkDisabled: true,
        // Beperkingen op resources
        HostConfig: {
            Memory: CONFIG.memoryLimitMB * 1024 * 1024,    // 64MB
            MemorySwap: CONFIG.memoryLimitMB * 1024 * 1024, // Geen swap
            CpuPeriod: 100000,
            CpuQuota: 50000,        // 50% van 1 CPU core
            PidsLimit: 50,          // Max 50 processen
            ReadonlyRootfs: true,   // Read-only bestandssysteem
            // Tmpfs voor /tmp zodat Python tijdelijke bestanden kan schrijven
            Tmpfs: { '/tmp': 'rw,noexec,nosuid,size=10m' },
            // Beveiligingsopties
            SecurityOpt: ['no-new-privileges'],
        },
        // Draai als non-root gebruiker
        User: 'nobody',
        // Werkdirectory
        WorkingDir: '/tmp',
    });

    try {
        // Container starten
        await container.start();

        // Wacht tot de container klaar is, met een tijdslimiet
        const waitPromise = container.wait();
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(async () => {
                try {
                    await container.kill();
                } catch (e) {
                    // Container is mogelijk al gestopt
                }
                reject(new Error('TIMEOUT'));
            }, CONFIG.timeoutSeconds * 1000);
        });

        let timedOut = false;
        let exitCode = -1;

        try {
            const result = await Promise.race([waitPromise, timeoutPromise]);
            exitCode = result.StatusCode;
        } catch (err) {
            if (err.message === 'TIMEOUT') {
                timedOut = true;
            } else {
                throw err;
            }
        }

        // Output ophalen
        const logs = await container.logs({
            stdout: true,
            stderr: true,
            follow: false,
        });

        // Docker log stream bevat header bytes, die strippen we eruit
        let output = logs.toString('utf8');
        // Verwijder Docker stream headers (eerste 8 bytes per chunk)
        output = output.replace(/[\x00-\x08]/g, '').trim();

        // Output inkorten als het te lang is
        if (output.length > CONFIG.maxOutputLength) {
            output = output.substring(0, CONFIG.maxOutputLength) + '\n... (output ingekort)';
        }

        const duration = Date.now() - startTime;

        if (timedOut) {
            return {
                success: false,
                output: output || '',
                error: `Tijdslimiet overschreden! Je code werd gestopt na ${CONFIG.timeoutSeconds} seconden. Heb je misschien een oneindige loop?`,
                duration: duration,
                timedOut: true,
            };
        }

        return {
            success: exitCode === 0,
            output: output,
            error: exitCode !== 0 ? output : null,
            duration: duration,
            exitCode: exitCode,
            timedOut: false,
        };

    } finally {
        // Container altijd opruimen
        try {
            await container.remove({ force: true });
        } catch (e) {
            // Negeer fouten bij opruimen
        }
    }
}

// ══════════════════════════════════════════════
// API ENDPOINTS
// ══════════════════════════════════════════════

// Code uitvoeren
app.post('/api/execute', async (req, res) => {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Geen code ontvangen.' });
    }

    if (code.length > 5000) {
        return res.status(400).json({ error: 'Code is te lang (max 5000 karakters).' });
    }

    try {
        console.log(`Code ontvangen (${code.length} karakters), uitvoeren in sandbox...`);
        const result = await executeCode(code);
        console.log(`Klaar in ${result.duration}ms, success=${result.success}`);
        res.json(result);
    } catch (err) {
        console.error('Fout bij uitvoeren:', err.message);
        res.status(500).json({ error: 'Interne fout bij het uitvoeren van de code.' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', config: CONFIG });
});

// ══════════════════════════════════════════════
// SERVER STARTEN
// ══════════════════════════════════════════════
const PORT = 3000;

pullImage().then(() => {
    app.listen(PORT, () => {
        console.log(`Sandbox API draait op http://localhost:${PORT}`);
        console.log(`Beperkingen: ${CONFIG.timeoutSeconds}s timeout, ${CONFIG.memoryLimitMB}MB geheugen, geen netwerk`);
    });
});