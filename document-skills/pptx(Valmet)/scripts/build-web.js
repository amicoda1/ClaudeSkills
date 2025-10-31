#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const Mustache = require('mustache');
const yaml = require('js-yaml');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--spec') {
      args.spec = argv[++i];
    } else if (arg === '--out') {
      args.out = argv[++i];
    } else if (arg === '--force') {
      args.force = true;
    } else {
      throw new Error(`Argumento desconhecido: ${arg}`);
    }
  }
  if (!args.spec) {
    throw new Error('Informe --spec <arquivo.yml|json>');
  }
  return args;
}

async function readSpec(specPath) {
  const raw = await fs.readFile(specPath, 'utf8');
  if (specPath.endsWith('.json')) {
    return JSON.parse(raw);
  }
  return yaml.load(raw);
}

async function prepareOutputDirectory(dir, force = false) {
  let exists = false;
  try {
    await fs.access(dir);
    exists = true;
  } catch (err) {
    exists = false;
  }

  if (exists) {
    if (!force) {
      throw new Error(`O diretório de saída ${dir} já existe. Use --force para sobrescrever.`);
    }
    await fs.rm(dir, { recursive: true, force: true });
  }

  await fs.mkdir(dir, { recursive: true });
}

function baseContext(tokens) {
  return {
    background_color: tokens.colors.lightGray,
    text_color: tokens.colors.charcoal,
    primary_color: tokens.colors.primary,
    accent_color: tokens.colors.accentBlue
  };
}

function formatDataPairs(pairs) {
  if (!Array.isArray(pairs)) return null;
  return {
    pairs: pairs.map((pair) => {
      if (Array.isArray(pair) && pair.length >= 2) {
        return { value: `${pair[0]} → ${pair[1]}` };
      }
      if (typeof pair === 'string') {
        return { value: pair };
      }
      return { value: String(pair) };
    })
  };
}

function templateForType(type) {
  const map = {
    cover: 'cover.html',
    agenda: 'agenda.html',
    section: 'section.html',
    'two-column': 'two-column.html',
    checklist: 'checklist.html',
    qna: 'qna.html',
    example: 'example.html',
    interpret: 'interpret.html'
  };
  const tpl = map[type];
  if (!tpl) {
    throw new Error(`Tipo de slide não suportado: ${type}`);
  }
  return tpl;
}

async function loadTemplate(root, filename) {
  const templatePath = path.join(root, 'templates', filename);
  return fs.readFile(templatePath, 'utf8');
}

async function loadTokens(root) {
  const tokensPath = path.join(root, 'theme', 'valmet.tokens.json');
  const raw = await fs.readFile(tokensPath, 'utf8');
  return JSON.parse(raw);
}

async function copyAsset(srcPath, destDir) {
  await fs.mkdir(destDir, { recursive: true });
  const fileName = path.basename(srcPath);
  const destPath = path.join(destDir, fileName);
  await fs.copyFile(srcPath, destPath);
  return fileName;
}

function slideContext(slide, tokens, helpers) {
  const ctx = { ...baseContext(tokens), ...slide };
  ctx.tagline = slide.tagline || slide.tag || ctx.tagline || '';

  if (slide.type === 'section') {
    ctx.background_color = tokens.colors.primary;
    ctx.text_color = tokens.colors.white;
  }

  if (slide.type === 'example') {
    ctx.chart_image = slide.chart_image_relative || '';
    ctx.data_pairs = formatDataPairs(slide.data_pairs);
    ctx.bullets = slide.bullets || [];
  }

  if (slide.type === 'interpret' && slide.highlight) {
    ctx.highlight = slide.highlight;
    ctx.items = slide.items || [];
  }

  if (slide.type === 'agenda' && Array.isArray(slide.items)) {
    ctx.items = slide.items;
  }

  if (slide.type === 'two-column') {
    ctx.left = slide.left || [];
    ctx.right = slide.right || [];
  }

  if (slide.type === 'checklist') {
    ctx.items = slide.items || [];
  }

  if (slide.type === 'qna') {
    ctx.subtitle = slide.subtitle || '';
  }

  if (slide.type === 'section') {
    ctx.title = slide.title || '';
  }

  return ctx;
}

function renderTemplate(template, context) {
  return Mustache.render(template, context);
}

async function buildIndex(slides, outDir, tokens) {
  const indexTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{{title}}</title>
<style>
body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: {{background}};
  color: {{text}};
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
header {
  padding: 1.5rem 2rem;
}
main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
iframe {
  width: min(960px, 95vw);
  aspect-ratio: 16 / 9;
  border: none;
  border-radius: 24px;
  box-shadow: 0 18px 50px -24px rgba(76, 77, 79, 0.5);
  background: #fff;
}
.nav {
  display: flex;
  gap: 1rem;
  align-items: center;
}
button {
  border: none;
  background: linear-gradient(120deg, {{primary}}, {{accent}});
  color: #fff;
  padding: 0.6rem 1.2rem;
  border-radius: 12px;
  font-size: 1rem;
  cursor: pointer;
}
.dots {
  display: flex;
  gap: 0.6rem;
}
.dots span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(76,77,79,0.35);
}
.dots span.active {
  background: linear-gradient(120deg, {{primary}}, {{accent}});
  transform: scale(1.3);
}
@media (max-width: 768px) {
  iframe {
    width: 100vw;
    border-radius: 0;
    box-shadow: none;
  }
}
</style>
</head>
<body>
<header>
  <h1>{{title}}</h1>
</header>
<main>
  <iframe id="slideFrame" src="slides/{{firstSlide}}" title="Slide"></iframe>
  <div class="nav">
    <button id="prev">Back</button>
    <div class="dots" id="dots"></div>
    <button id="next">Next</button>
  </div>
</main>
<script>
const slides = {{slides}};
let index = 0;
const frame = document.getElementById('slideFrame');
const dots = document.getElementById('dots');
function renderDots() {
  dots.innerHTML = '';
  slides.forEach((_, i) => {
    const span = document.createElement('span');
    if (i === index) span.classList.add('active');
    dots.appendChild(span);
  });
}
function goTo(i) {
  index = (i + slides.length) % slides.length;
  frame.src = 'slides/' + slides[index];
  renderDots();
}
renderDots();
document.getElementById('prev').addEventListener('click', () => goTo(index - 1));
document.getElementById('next').addEventListener('click', () => goTo(index + 1));
window.addEventListener('keydown', (ev) => {
  if (ev.key === 'ArrowRight' || ev.key === 'PageDown') goTo(index + 1);
  if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') goTo(index - 1);
});
</script>
</body>
</html>`;

  const html = Mustache.render(indexTemplate, {
    title: slides.length ? slides[0].metaTitle : 'Valmet Deck',
    background: tokens.colors.lightGray,
    text: tokens.colors.charcoal,
    primary: tokens.colors.primary,
    accent: tokens.colors.accentBlue,
    firstSlide: slides.length ? slides[0].file : '',
    slides: JSON.stringify(slides.map((s) => s.file))
  });
  await fs.writeFile(path.join(outDir, 'index.html'), html, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv);
  const root = path.resolve(__dirname, '..');
  const specPath = path.resolve(args.spec);
  const spec = await readSpec(specPath);

  const outDir = args.out ? path.resolve(args.out) : (spec.output && spec.output.web_dir ? path.resolve(spec.output.web_dir) : null);
  if (!outDir) {
    throw new Error('Informe --out <dir> ou defina output.web_dir no spec.');
  }

  const slidesDir = path.join(outDir, 'slides');
  const assetsDir = path.join(outDir, 'assets');

  await prepareOutputDirectory(outDir, Boolean(args.force));
  await fs.mkdir(slidesDir, { recursive: true });
  await fs.mkdir(assetsDir, { recursive: true });

  const tokens = await loadTokens(path.resolve(__dirname, '..'));

  const slideSpecs = spec.slides || [];
  const templateCache = new Map();
  const assetCache = new Map();
  const baseDir = path.dirname(specPath);
  const renderedSlides = [];

  for (let i = 0; i < slideSpecs.length; i += 1) {
    const slide = slideSpecs[i];
    const type = slide.type;
    if (!type) {
      throw new Error(`Slide ${i + 1} sem campo "type".`);
    }

    const templateName = templateForType(type);
    if (!templateCache.has(templateName)) {
      const tpl = await loadTemplate(path.resolve(__dirname, '..'), templateName);
      templateCache.set(templateName, tpl);
    }

    const slideCopy = { ...slide };

    if (slide.chart_image) {
      const src = path.resolve(baseDir, slide.chart_image);
      if (!assetCache.has(src)) {
        const copiedName = await copyAsset(src, assetsDir);
        assetCache.set(src, copiedName);
      }
      const copiedName = assetCache.get(src);
      slideCopy.chart_image_relative = `../assets/${copiedName}`;
    }

    if (Array.isArray(slide.data_pairs)) {
      slideCopy.data_pairs = slide.data_pairs;
    }

    const context = slideContext(slideCopy, tokens);
    const html = renderTemplate(templateCache.get(templateName), context);
    const fileName = `slide${String(i + 1).padStart(2, '0')}.html`;
    await fs.writeFile(path.join(slidesDir, fileName), html, 'utf8');
    renderedSlides.push({ file: fileName, metaTitle: slide.title || `Slide ${i + 1}` });
  }

  await buildIndex(renderedSlides, outDir, tokens);
  await fs.writeFile(path.join(outDir, 'deck.json'), JSON.stringify(spec, null, 2), 'utf8');
  console.log(`Deck web gerado em ${outDir}`);
}

main().catch((err) => {
  console.error('Erro ao gerar deck web:', err.message);
  process.exit(1);
});
