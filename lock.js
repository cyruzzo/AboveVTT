// basic script to create a simple LOCK file of our external dependencies

const crypto = require('crypto');
const fs = require('fs');
const lockFile = 'LOCK';

const externalDependencies = [
    "color-picker.js",
    "external_api.js",
    "mousetrap.1.6.5.min.js",
    "purify.min.js",
    "rpg-dice-roller.bundle.min.js",
]

let out = "# This file was generated, to update it run `node lock.js`"

externalDependencies.forEach(file => {
    const fileBuffer = fs.readFileSync(file);
    const hashSum = crypto.createHash('sha1');
    hashSum.update(fileBuffer);
    const hex = hashSum.digest('hex');
    out += `\n${hex}\t${file}`
});

fs.writeFile(lockFile, out + "\n", err => {
    if (err) {
        console.error(err)
        process.exit(1);
    }
});