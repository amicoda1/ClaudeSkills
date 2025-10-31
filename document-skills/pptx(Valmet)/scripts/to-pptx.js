#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const pptxgen = require('pptxgenjs');

const modulePaths = [
  path.resolve(__dirname, '..', 'node_modules'),
  path.resolve(__dirname, '..', '..', '..', 'node_modules')
];
const existingNodePath = process.env.NODE_PATH ? process.env.NODE_PATH.split(path.delimiter) : [];
const combined = [...modulePaths, ...existingNodePath.filter(Boolean)];
process.env.NODE_PATH = combined.join(path.delimiter);
require('module').Module._initPaths();

const html2pptx = require(path.resolve(__dirname, '../../pptx/scripts/html2pptx.js'));

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--slides') {
      args.slides = argv[++i];
    } else if (arg === '--out') {
      args.out = argv[++i];
    } else if (arg === '--title') {
      args.title = argv[++i];
    } else if (arg === '--author') {
      args.author = argv[++i];
    } else {
      throw new Error(`Argumento desconhecido: ${arg}`);
    }
  }
  if (!args.slides) {
    throw new Error('Informe --slides <diretorio com slides HTML>');
  }
  if (!args.out) {
    throw new Error('Informe --out <arquivo.pptx>');
  }
  return args;
}

async function listSlides(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function main() {
  const args = parseArgs(process.argv);
  const slidesDir = path.resolve(args.slides);
  const outFile = path.resolve(args.out);

  const files = await listSlides(slidesDir);
  if (files.length === 0) {
    throw new Error('Nenhum slide HTML encontrado no diretório informado.');
  }

  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  if (args.author) pres.author = args.author;
  if (args.title) pres.title = args.title;

  for (const file of files) {
    const fullPath = path.join(slidesDir, file);
    console.log(`Convertendo ${file}...`);
    await html2pptx(fullPath, pres);
  }

  await pres.writeFile({ fileName: outFile });
  console.log(`Apresentação salva em ${outFile}`);
}

main().catch((err) => {
  console.error('Erro na conversão HTML → PPTX:', err.message);
  process.exit(1);
});
