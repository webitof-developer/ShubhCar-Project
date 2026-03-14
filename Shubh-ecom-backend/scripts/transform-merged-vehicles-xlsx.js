const path = require('path');
const ExcelJS = require('exceljs');

const DEFAULT_INPUT = path.resolve(
  __dirname,
  '..',
  '..',
  'merged_vehicle_models_cleaned.xlsx',
);
const DEFAULT_OUTPUT = path.resolve(
  __dirname,
  '..',
  '..',
  'merged_vehicle_models_schema_ready.xlsx',
);

const CURRENT_YEAR = new Date().getFullYear();

const normalize = (value) => String(value || '').trim();

const toSlug = (value) =>
  normalize(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const firstYearInText = (value) => {
  const text = normalize(value);
  if (!text) return null;
  const match = text.match(/(19|20)\d{2}/);
  return match ? Number(match[0]) : null;
};

const parseYearBound = (value) => {
  const text = normalize(value).toLowerCase();
  if (!text) return null;
  if (text.includes('now') || text.includes('present') || text.includes('current')) {
    return CURRENT_YEAR;
  }
  return firstYearInText(text);
};

const parseYearRangeText = (value) => {
  const text = normalize(value).toLowerCase();
  if (!text) return { start: null, end: null };

  const years = (text.match(/(19|20)\d{2}/g) || []).map(Number);
  if (!years.length) {
    return { start: null, end: text.includes('now') ? CURRENT_YEAR : null };
  }

  const start = years[0];
  const end =
    years[1] ||
    (text.includes('now') || text.includes('present') || text.includes('current')
      ? CURRENT_YEAR
      : years[0]);
  return { start, end };
};

const resolveYearRange = ({ yearFrom, yearTo, yearRange }) => {
  let start = parseYearBound(yearFrom);
  let end = parseYearBound(yearTo);

  const fromRange = parseYearRangeText(yearRange);
  if (!start) start = fromRange.start;
  if (!end) end = fromRange.end;

  if (start && !end) end = start;
  if (!start && end) start = end;
  if (!start || !end) return { start: null, end: null };

  if (start > end) [start, end] = [end, start];
  return { start, end };
};

const expandYears = (start, end) => {
  if (!start || !end) return [];
  const years = [];
  for (let y = start; y <= end; y += 1) years.push(y);
  return years;
};

async function transform(inputPath, outputPath) {
  const inputWb = new ExcelJS.Workbook();
  await inputWb.xlsx.readFile(inputPath);
  const inSheet = inputWb.worksheets[0];
  if (!inSheet) throw new Error('Input workbook has no sheets');

  const headers = inSheet.getRow(1).values.slice(1).map((h) => normalize(h));
  const index = {};
  headers.forEach((h, i) => {
    index[h] = i + 1;
  });

  const get = (row, key) => {
    const col = index[key];
    if (!col) return '';
    return normalize(row.getCell(col).value);
  };

  const outWb = new ExcelJS.Workbook();
  const out = outWb.addWorksheet('VehicleSchemaReady');
  out.columns = [
    { header: 'source_row', key: 'source_row', width: 10 },
    { header: 'source_key', key: 'source_key', width: 30 },
    { header: 'source_name', key: 'source_name', width: 15 },
    { header: 'brand_name', key: 'brand_name', width: 24 },
    { header: 'brand_slug', key: 'brand_slug', width: 24 },
    { header: 'model_name', key: 'model_name', width: 30 },
    { header: 'model_slug', key: 'model_slug', width: 30 },
    { header: 'variant_name', key: 'variant_name', width: 30 },
    { header: 'generation_value', key: 'generation_value', width: 30 },
    { header: 'grouping_source', key: 'grouping_source', width: 18 },
    { header: 'year_start', key: 'year_start', width: 10 },
    { header: 'year_end', key: 'year_end', width: 10 },
    { header: 'years_csv', key: 'years_csv', width: 40 },
    { header: 'status', key: 'status', width: 12 },
    { header: 'body_type', key: 'body_type', width: 20 },
    { header: 'engines_raw', key: 'engines_raw', width: 40 },
    { header: 'tecdoc_vehicle_id', key: 'tecdoc_vehicle_id', width: 18 },
    { header: 'source_url', key: 'source_url', width: 45 },
    { header: 'source_brand_id', key: 'source_brand_id', width: 14 },
    { header: 'source_model_id', key: 'source_model_id', width: 14 },
    { header: 'import_ready', key: 'import_ready', width: 12 },
    { header: 'import_note', key: 'import_note', width: 45 },
  ];

  let total = 0;
  let ready = 0;
  let activeMissingGeneration = 0;
  let fallbackToVariantName = 0;

  for (let r = 2; r <= inSheet.rowCount; r += 1) {
    const row = inSheet.getRow(r);
    const brandName = get(row, 'Brand');
    const modelName = get(row, 'Model');
    const generationVariant = get(row, 'Generation / Variant');
    const bodyType = get(row, 'Body Type');
    const yearFrom = get(row, 'Year From');
    const yearTo = get(row, 'Year To');
    const yearRange = get(row, 'Year Range');
    const sourceName = get(row, 'Source');
    const sourceKey = get(row, '__key');
    const sourceStatus = get(row, 'Status');
    const engines = get(row, 'Engine(s)');
    const tecdocVehicleId = get(row, 'Vehicle ID (TecDoc)');
    const sourceBrandId = get(row, 'Brand ID');
    const sourceModelId = get(row, 'Model ID');
    const sourceUrl = get(row, 'Boodmo URL');

    if (!brandName && !modelName) continue;
    total += 1;

    const generationValue = generationVariant || '';
    const variantName = generationVariant || bodyType || 'Standard';
    const groupingSource = generationValue ? 'generation' : 'variantName';
    const { start: yearStart, end: yearEnd } = resolveYearRange({
      yearFrom,
      yearTo,
      yearRange,
    });
    const years = expandYears(yearStart, yearEnd);

    const status = normalize(sourceStatus).toLowerCase() === 'inactive' ? 'inactive' : 'active';
    if (status === 'active' && !generationValue) activeMissingGeneration += 1;
    if (!generationValue) fallbackToVariantName += 1;
    const importReady = Boolean(brandName && modelName && variantName && yearStart && yearEnd);
    if (importReady) ready += 1;

    out.addRow({
      source_row: r,
      source_key: sourceKey,
      source_name: sourceName,
      brand_name: brandName,
      brand_slug: toSlug(brandName),
      model_name: modelName,
      model_slug: toSlug(modelName),
      variant_name: variantName,
      generation_value: generationValue,
      grouping_source: groupingSource,
      year_start: yearStart || '',
      year_end: yearEnd || '',
      years_csv: years.join(','),
      status,
      body_type: bodyType,
      engines_raw: engines,
      tecdoc_vehicle_id: tecdocVehicleId,
      source_url: sourceUrl,
      source_brand_id: sourceBrandId,
      source_model_id: sourceModelId,
      import_ready: importReady ? 'yes' : 'no',
      import_note: importReady ? '' : 'Missing brand/model/variant/year range',
    });
  }

  await outWb.xlsx.writeFile(outputPath);
  console.error(`Input rows processed: ${total}`);
  console.error(`Import-ready rows: ${ready}`);
  console.error(`Active rows missing generation: ${activeMissingGeneration}`);
  console.error(`Rows using variantName fallback grouping: ${fallbackToVariantName}`);
  console.error(`Output written: ${outputPath}`);
}

const inputArg = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_INPUT;
const outputArg = process.argv[3] ? path.resolve(process.argv[3]) : DEFAULT_OUTPUT;

transform(inputArg, outputArg).catch((err) => {
  console.error('Transform failed:', err.message);
  process.exit(1);
});
